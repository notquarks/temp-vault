import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { shares, filelist } from "../db/schema";
import {
  createShareCapability,
  hashShareCapability,
  hasValidShareCapability,
  SHARE_TTL_MS,
} from "../lib/share-access";
import { auth } from "../lib/auth";

const share = new Hono();

function shareToken(c: { req: { header: (name: string) => string | undefined } }) {
  return c.req.header("x-share-token");
}

share.post("/create", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const fileId =
    typeof body === "object" && body !== null && "fileId" in body
      ? (body as { fileId?: unknown }).fileId
      : undefined;
  if (typeof fileId !== "string" || !fileId) {
    return c.json({ error: "Missing fileId" }, 400);
  }

  const fileRow = await db
    .select()
    .from(filelist)
    .where(eq(filelist.id, fileId))
    .then((rows) => rows[0]);

  if (!fileRow) return c.json({ error: "File not found" }, 404);
  if (fileRow.isGuest) {
    return c.json({ error: "Guest uploads cannot create share links" }, 403);
  }
  if (fileRow.ownerId !== session.user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const shareId = crypto.randomUUID();
  const capability = createShareCapability();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SHARE_TTL_MS);

  await db.insert(shares).values({
    id: shareId,
    fileId,
    key: "migrated",
    capabilityHash: hashShareCapability(capability),
    expiresAt,
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ shareId, capability, expiresAt: expiresAt.toISOString() });
});

share.get("/:id", async (c) => {
  const shareId = c.req.param("id");
  const shareRow = await db
    .select()
    .from(shares)
    .where(eq(shares.id, shareId))
    .then((rows) => rows[0]);

  if (!shareRow) return c.json({ error: "Share not found" }, 404);
  const capability = shareToken(c);
  if (
    !shareRow.capabilityHash ||
    !capability ||
    shareRow.revokedAt ||
    !shareRow.expiresAt ||
    shareRow.expiresAt <= new Date() ||
    !(await hasValidShareCapability(shareRow.fileId, shareId, capability))
  ) {
    return c.json({ error: "Share link expired or revoked" }, 403);
  }

  const fileRow = await db
    .select()
    .from(filelist)
    .where(eq(filelist.id, shareRow.fileId))
    .then((rows) => rows[0]);

  if (!fileRow) return c.json({ error: "File not found" }, 404);

  return c.json({ fileId: shareRow.fileId });
});

share.delete("/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const row = await db
    .select()
    .from(shares)
    .where(eq(shares.id, c.req.param("id")))
    .then((rows) => rows[0]);
  if (!row) return c.json({ error: "Share not found" }, 404);

  const file = await db
    .select()
    .from(filelist)
    .where(eq(filelist.id, row.fileId))
    .then((rows) => rows[0]);
  if (!file || file.ownerId !== session.user.id) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await db
    .update(shares)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(shares.id, row.id));
  return c.json({ success: true });
});

export default share;
