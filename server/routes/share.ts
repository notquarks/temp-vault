import { Hono } from "hono";
import { db } from "../lib/db";
import { shares, filelist } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth";

const share = new Hono();

share.post("/create", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body;
  try {
    body = await c.req.json();
  } catch {
    const text = await c.req.text();
    try {
      body = JSON.parse(text);
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
  }

  const fileId = body?.fileId;
  if (!fileId) {
    return c.json({ error: "Missing fileId" }, 400);
  }

  const fileRow = await db
    .select()
    .from(filelist)
    .where(eq(filelist.id, fileId))
    .then((r) => r[0]);

  if (!fileRow) return c.json({ error: "File not found" }, 404);
  if (fileRow.ownerId !== session.user.id) return c.json({ error: "Forbidden" }, 403);
  if (fileRow.private === 1) return c.json({ error: "Cannot share a private file" }, 400);

  const shareId = crypto.randomUUID();
  const shareKey = crypto.randomUUID();

  await db.insert(shares).values({
    id: shareId,
    fileId,
    key: shareKey,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return c.json({ shareId });
});

share.get("/:id", async (c) => {
  const shareId = c.req.param("id");
  const shareRow = await db
    .select()
    .from(shares)
    .where(eq(shares.id, shareId))
    .then((r) => r[0]);

  if (!shareRow) return c.json({ error: "Share not found" }, 404);

  const fileRow = await db
    .select()
    .from(filelist)
    .where(eq(filelist.id, shareRow.fileId))
    .then((r) => r[0]);

  if (!fileRow) return c.json({ error: "File not found" }, 404);
  
  if (fileRow.private === 1) {
    return c.json({ error: "This file is now private and cannot be accessed via share link." }, 403);
  }

  return c.json({ fileId: shareRow.fileId });
});

export default share;
