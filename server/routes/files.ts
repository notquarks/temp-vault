import { Hono } from "hono";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3";
import {
  decryptText,
  encryptFile,
  generateFileKey,
} from "../../app/lib/crypto";
import { db } from "../lib/db";
import { fileKeys, filelist, shares } from "../db/schema";
import { eq } from "../node_modules/drizzle-orm/index";
import { unwrapKey, wrappedKey } from "../lib/crypto";
import { auth } from "../lib/auth";

const files = new Hono();

files.get("/", async (c) => {
  return c.json({ files: [] });
});

files.post("/upload", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"] as File;
  const filetype = body["filetype"] as string | undefined;
  const filesizeStr = body["filesize"] as string | undefined;
  const filesize = Number(filesizeStr ?? 0);

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session && filesize > 10 * 1024 * 1024)
    return c.json({ error: "Guest uploads max 10MB" }, 413);

  const userId = session ? session.user.id : "guest";
  const filename = body["enc_name"] as string | undefined;
  const iv = body["iv"] as string | undefined;
  const ivName = body["iv_name"] as string | undefined;
  const keyB64 = body["key"] as string | undefined;

  if (!file || !filename || !iv || !ivName || !keyB64)
    return c.json({ error: "Missing required fields" }, 400);

  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  const encKey = wrappedKey(keyBytes.buffer, wrapIv);
  const wrapIvB64 = btoa(String.fromCharCode(...wrapIv));

  const fileId = crypto.randomUUID();

  await db.insert(filelist).values({
    id: fileId,
    name: filename,
    type: filetype || "application/octet-stream",
    size: filesizeStr || "0",
    private: 1,
    ownerId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(fileKeys).values({
    fileId: fileId,
    iv: iv,
    ivName: ivName,
    key: encKey.toString("base64"),
    wrapIv: wrapIvB64,
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKETNAME || "",
      Key: fileId,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    }),
  );
  return c.json({ fileId });
});

files.get("/user/:id", async (c) => {
  const userId = c.req.param("id")!;
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || session.user.id !== userId)
    return c.json({ error: "Unauthorized" }, 401);

  const rows = await db
    .select()
    .from(filelist)
    .where(eq(filelist.ownerId, userId))
    .leftJoin(fileKeys, eq(filelist.id, fileKeys.fileId));

  const result = rows.map(
    (
      row: typeof filelist.$inferSelect & {
        file_keys: typeof fileKeys.$inferSelect | null;
      },
    ) => {
      const fk = row.file_keys;
      let rawKey: string | null = null;
      if (fk) {
        try {
          const unwrapped = unwrapKey(
            Buffer.from(fk.key, "base64"),
            Uint8Array.from(atob(fk.wrapIv), (c) => c.charCodeAt(0)),
          );
          rawKey = btoa(String.fromCharCode(...new Uint8Array(unwrapped)));
        } catch {
          rawKey = null;
        }
      }
      return {
        ...row.files,
        iv: fk?.iv,
        ivName: fk?.ivName,
        key: rawKey,
      };
    },
  );

  return c.json({ data: result });
});

files.get("/:id", async (c) => {
  const fileId = c.req.param("id");

  const fileRow = await db
    .select()
    .from(filelist)
    .where(eq(filelist.id, fileId))
    .then((r) => r[0]);

  if (!fileRow) return c.json({ error: "File not found" }, 404);

  if (fileRow.private === 1) {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (!session || fileRow.ownerId !== session.user.id) {
      return c.json({ error: "Forbidden" }, 403);
    }
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
    const legacyKey = fileRow.name;
    if (!legacyKey) return c.json({ error: "File key missing" }, 404);
    response = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKETNAME || "",
        Key: legacyKey,
      }),
    );
  }

  if (!response.Body) {
    return c.json({ error: "File not found" }, 404);
  }

  const content =
    (await response.Body.transformToByteArray()) as Uint8Array<ArrayBuffer>;
  const contentType = response.ContentType ?? "application/octet-stream";

  if (content.length === 0) return c.json({ error: "Empty file" }, 404);

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": contentType,
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
  if (fileRow.private === 1) {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (!session || fileRow.ownerId !== session.user.id) {
      return c.json({ error: "Forbidden" }, 403);
    }
  }

  const fk = rows[0].file_keys;
  if (!fk) return c.json({ error: "File keys not found" }, 404);

  let rawKeyB64: string | null = null;
  try {
    const unwrapped = unwrapKey(
      Buffer.from(fk.key, "base64"),
      Uint8Array.from(atob(fk.wrapIv), (c) => c.charCodeAt(0)),
    );
    rawKeyB64 = btoa(String.fromCharCode(...new Uint8Array(unwrapped)));
  } catch {
    return c.json({ error: "Failed to decrypt file key" }, 500);
  }

  return c.json(
    {
      iv: fk.iv,
      encrypted_key: rawKeyB64,
      enc_name: rows[0].files.name,
      iv_name: fk.ivName,
    },
    200,
    {
      "Cache-Control": "no-store, must-revalidate",
    }
  );
});

files.delete("/:id", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const fileId = c.req.param("id");

  const fileRow = await db
    .select()
    .from(filelist)
    .where(eq(filelist.id, fileId))
    .then((r) => r[0]);

  if (!fileRow) return c.json({ error: "File not found" }, 404);

  if (fileRow.ownerId !== session.user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKETNAME || "",
        Key: fileId,
      }),
    );
    if (fileRow.name) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKETNAME || "",
          Key: fileRow.name,
        }),
      );
    }
  } catch (error) {
    console.error("Failed to delete from R2:", error);
    return c.json({ error: "Storage deletion failed" }, 500);
  }

  await db.delete(filelist).where(eq(filelist.id, fileId));

  return c.json({ success: true });
});

files.patch("/:id/privacy", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const fileId = c.req.param("id");
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const { isPrivate } = body;
  if (typeof isPrivate !== "boolean") {
    return c.json({ error: "Missing boolean isPrivate" }, 400);
  }

  const fileRow = await db
    .select()
    .from(filelist)
    .where(eq(filelist.id, fileId))
    .then((r) => r[0]);

  if (!fileRow) return c.json({ error: "File not found" }, 404);
  if (fileRow.ownerId !== session.user.id) return c.json({ error: "Forbidden" }, 403);

  await db
    .update(filelist)
    .set({ private: isPrivate ? 1 : 0 })
    .where(eq(filelist.id, fileId));

  return c.json({ success: true, private: isPrivate });
});

export default files;
