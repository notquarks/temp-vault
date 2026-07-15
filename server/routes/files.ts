import { Buffer } from "node:buffer";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { and, eq, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { fileKeys, filelist, guestUploadEvents } from "../db/schema";
import { auth } from "../lib/auth";
import { unwrapKey, wrappedKey } from "../lib/crypto";
import { db } from "../lib/db";
import {
  AUTHENTICATED_FILE_LIMIT,
  clientIp,
  GUEST_BYTES_PER_DAY,
  GUEST_FILE_LIMIT,
  hashCapability,
  hashIp,
  issueGuestChallenge,
  safeHashEquals,
  verifyAndReserveGuestUpload,
} from "../lib/guest-security";
import { s3 } from "../lib/s3";

const files = new Hono();
const GUEST_OWNER_ID = "__guest__";

function decodeBase64(value: string): Uint8Array | null {
  try {
    const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
    return bytes.length > 0 ? bytes : null;
  } catch {
    return null;
  }
}

async function canReadPrivateFile(c: any, file: typeof filelist.$inferSelect) {
  if (file.private !== 1) return true;
  if (file.isGuest) {
    return safeHashEquals(
      file.guestAccessHash,
      c.req.header("x-guest-access-token") || "",
    );
  }
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return Boolean(session && file.ownerId === session.user.id);
}

files.get("/", (c) => c.json({ files: [] }));

files.get("/guest-challenge", (c) => {
  try {
    const ip = clientIp(c);
    if (!ip) {
      return c.json(
        { error: "Guest uploads are unavailable from this network" },
        403,
      );
    }
    return c.json(issueGuestChallenge(hashIp(ip)), 200, {
      "Cache-Control": "no-store",
    });
  } catch {
    return c.json({ error: "Guest uploads are not configured" }, 503);
  }
});

files.post("/upload", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const isGuest = !session;
  let guestEventId: string | undefined;
  let guestIpHash: string | undefined;

  if (isGuest) {
    try {
      const ip = clientIp(c);
      if (!ip) {
        return c.json(
          { error: "Guest uploads are unavailable from this network" },
          403,
        );
      }
      guestIpHash = hashIp(ip);
      const reservation = await verifyAndReserveGuestUpload(
        guestIpHash,
        c.req.header("x-guest-challenge"),
        c.req.header("x-guest-proof"),
      );
      if ("error" in reservation) {
        return c.json({ error: reservation.error }, reservation.status);
      }
      guestEventId = reservation.eventId;
    } catch {
      return c.json({ error: "Guest upload checks are unavailable" }, 503);
    }
  }

  let body: Record<string, string | File | (string | File)[]>;
  try {
    body = await c.req.parseBody();
  } catch {
    return c.json({ error: "Invalid multipart upload" }, 400);
  }

  const file = body.file;
  const filename = body.enc_name;
  const iv = body.iv;
  const ivName = body.iv_name;
  const keyB64 = body.key;
  const filetype = body.filetype;
  const filesizeRaw = body.filesize;
  if (
    !(file instanceof File) ||
    typeof filename !== "string" ||
    typeof iv !== "string" ||
    typeof ivName !== "string" ||
    typeof keyB64 !== "string" ||
    typeof filesizeRaw !== "string"
  ) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const declaredSize = Number(filesizeRaw);
  const maxSize = isGuest ? GUEST_FILE_LIMIT : AUTHENTICATED_FILE_LIMIT;
  if (!Number.isSafeInteger(declaredSize) || declaredSize <= 0) {
    return c.json({ error: "Invalid file size" }, 400);
  }
  if (declaredSize > maxSize || file.size > maxSize + 16) {
    return c.json(
      {
        error: `${isGuest ? "Guest" : "Authenticated"} uploads max ${maxSize / 1024 / 1024}MB`,
      },
      413,
    );
  }
  if (file.size !== declaredSize + 16) {
    return c.json(
      { error: "Encrypted payload size does not match metadata" },
      400,
    );
  }
  if (
    filename.length > 16_384 ||
    (typeof filetype === "string" && filetype.length > 255)
  ) {
    return c.json({ error: "Invalid file metadata" }, 400);
  }

  const keyBytes = decodeBase64(keyB64);
  const fileIv = decodeBase64(iv);
  const nameIv = decodeBase64(ivName);
  if (
    keyBytes?.length !== 32 ||
    fileIv?.length !== 12 ||
    nameIv?.length !== 12
  ) {
    return c.json({ error: "Invalid encryption metadata" }, 400);
  }

  if (isGuest && guestIpHash && guestEventId) {
    await db
      .update(guestUploadEvents)
      .set({ size: declaredSize, status: "reserved" })
      .where(eq(guestUploadEvents.id, guestEventId));
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [usage] = await db
      .select({
        bytes: sql<number>`coalesce(sum(${guestUploadEvents.size}), 0)`,
      })
      .from(guestUploadEvents)
      .where(
        and(
          eq(guestUploadEvents.ipHash, guestIpHash),
          gte(guestUploadEvents.createdAt, dayAgo),
        ),
      );
    if (Number(usage?.bytes ?? 0) > GUEST_BYTES_PER_DAY) {
      await db
        .update(guestUploadEvents)
        .set({ size: 0, status: "rejected" })
        .where(eq(guestUploadEvents.id, guestEventId));
      return c.json({ error: "Daily guest storage limit reached" }, 429);
    }
  }

  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedKey = wrappedKey(keyBytes.buffer as ArrayBuffer, wrapIv);
  const fileId = crypto.randomUUID();
  const guestAccessToken = isGuest
    ? Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
        "base64url",
      )
    : undefined;
  const now = new Date();

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKETNAME || "",
        Key: fileId,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: "application/octet-stream",
      }),
    );

    await db.insert(filelist).values({
      id: fileId,
      name: filename,
      type:
        typeof filetype === "string" && filetype
          ? filetype
          : "application/octet-stream",
      size: String(declaredSize),
      private: isGuest ? 0 : 1,
      ownerId: session?.user.id || GUEST_OWNER_ID,
      isGuest,
      guestAccessHash: guestAccessToken
        ? hashCapability(guestAccessToken)
        : null,
      guestIpHash: guestIpHash || null,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(fileKeys).values({
      fileId,
      iv,
      ivName,
      key: encryptedKey.toString("base64"),
      wrapIv: Buffer.from(wrapIv).toString("base64"),
    });
    if (guestEventId) {
      await db
        .update(guestUploadEvents)
        .set({ size: declaredSize, status: "completed" })
        .where(eq(guestUploadEvents.id, guestEventId));
    }
  } catch (error) {
    await s3
      .send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKETNAME || "",
          Key: fileId,
        }),
      )
      .catch(() => undefined);
    try {
      await db.delete(filelist).where(eq(filelist.id, fileId));
    } catch {}
    if (guestEventId) {
      try {
        await db
          .update(guestUploadEvents)
          .set({ size: 0, status: "failed" })
          .where(eq(guestUploadEvents.id, guestEventId));
      } catch {}
    }
    console.error("Upload failed:", error);
    return c.json({ error: "Upload could not be stored" }, 500);
  }

  return c.json({
    fileId,
    fileName: "encrypted",
    fileSize: declaredSize,
    fileType:
      typeof filetype === "string" ? filetype : "application/octet-stream",
    uploadedAt: now.toISOString(),
    isGuest,
    guestAccessToken,
  });
});

files.get("/user/:id", async (c) => {
  const userId = c.req.param("id");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || session.user.id !== userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const rows = await db
    .select()
    .from(filelist)
    .where(and(eq(filelist.ownerId, userId), eq(filelist.isGuest, false)))
    .leftJoin(fileKeys, eq(filelist.id, fileKeys.fileId));
  const result = rows.map((row) => {
    const fk = row.file_keys;
    let rawKey: string | null = null;
    if (fk) {
      try {
        const unwrapped = unwrapKey(
          Buffer.from(fk.key, "base64"),
          Buffer.from(fk.wrapIv, "base64"),
        );
        rawKey = Buffer.from(unwrapped).toString("base64");
      } catch {
        rawKey = null;
      }
    }
    return { ...row.files, iv: fk?.iv, ivName: fk?.ivName, key: rawKey };
  });
  return c.json({ data: result });
});

files.get("/:id", async (c) => {
  const fileId = c.req.param("id");
  const fileRow = await db
    .select()
    .from(filelist)
    .where(eq(filelist.id, fileId))
    .then((rows) => rows[0]);
  if (!fileRow) return c.json({ error: "File not found" }, 404);
  if (!(await canReadPrivateFile(c, fileRow))) {
    return c.json({ error: "Forbidden" }, 403);
  }

  let response;
  try {
    response = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKETNAME || "",
        Key: fileId,
      }),
    );
  } catch {
    if (!fileRow.name) return c.json({ error: "File not found" }, 404);
    response = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKETNAME || "",
        Key: fileRow.name,
      }),
    );
  }
  if (!response.Body) return c.json({ error: "File not found" }, 404);
  const content = await response.Body.transformToByteArray();
  if (content.length === 0) return c.json({ error: "Empty file" }, 404);
  const responseBody = content.buffer.slice(
    content.byteOffset,
    content.byteOffset + content.byteLength,
  ) as ArrayBuffer;
  return new Response(responseBody, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `inline; filename="${fileId}"`,
      "Cache-Control": "no-store, must-revalidate",
    },
  });
});

files.get("/:id/meta", async (c) => {
  const fileId = c.req.param("id");
  const rows = await db
    .select()
    .from(filelist)
    .where(eq(filelist.id, fileId))
    .leftJoin(fileKeys, eq(filelist.id, fileKeys.fileId));
  if (rows.length === 0) return c.json({ error: "File not found" }, 404);
  const fileRow = rows[0].files;
  if (!(await canReadPrivateFile(c, fileRow))) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const fk = rows[0].file_keys;
  if (!fk) return c.json({ error: "File keys not found" }, 404);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const canShare = Boolean(
    session &&
    !fileRow.isGuest &&
    fileRow.private !== 1 &&
    fileRow.ownerId === session.user.id,
  );

  try {
    const unwrapped = unwrapKey(
      Buffer.from(fk.key, "base64"),
      Buffer.from(fk.wrapIv, "base64"),
    );
    return c.json(
      {
        iv: fk.iv,
        encrypted_key: Buffer.from(unwrapped).toString("base64"),
        enc_name: fileRow.name,
        iv_name: fk.ivName,
        fileType: fileRow.type,
        isPrivate: fileRow.private === 1,
        isGuest: fileRow.isGuest,
        canShare,
      },
      200,
      { "Cache-Control": "no-store, must-revalidate" },
    );
  } catch {
    return c.json({ error: "Failed to decrypt file key" }, 500);
  }
});

files.delete("/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  const fileId = c.req.param("id");
  const fileRow = await db
    .select()
    .from(filelist)
    .where(eq(filelist.id, fileId))
    .then((rows) => rows[0]);
  if (!fileRow) return c.json({ error: "File not found" }, 404);
  if (fileRow.isGuest) {
    return c.json({ error: "Guest uploads cannot be deleted by clients" }, 403);
  }
  if (fileRow.ownerId !== session.user.id)
    return c.json({ error: "Forbidden" }, 403);

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKETNAME || "",
        Key: fileId,
      }),
    );
  } catch (error) {
    console.error("Failed to delete from R2:", error);
    return c.json({ error: "Storage deletion failed" }, 500);
  }
  await db.delete(filelist).where(eq(filelist.id, fileId));
  return c.json({ success: true });
});

files.patch("/:id/privacy", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  const fileId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body.isPrivate !== "boolean") {
    return c.json({ error: "Missing boolean isPrivate" }, 400);
  }
  const fileRow = await db
    .select()
    .from(filelist)
    .where(eq(filelist.id, fileId))
    .then((rows) => rows[0]);
  if (!fileRow) return c.json({ error: "File not found" }, 404);
  if (fileRow.isGuest || fileRow.ownerId !== session.user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await db
    .update(filelist)
    .set({ private: body.isPrivate ? 1 : 0, updatedAt: new Date() })
    .where(eq(filelist.id, fileId));
  return c.json({ success: true, private: body.isPrivate });
});

export default files;
