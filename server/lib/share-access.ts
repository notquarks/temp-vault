import { createHash, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { shares } from "../db/schema";
import { db } from "./db";

export const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashShareCapability(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createShareCapability(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    "base64url",
  );
}

export function safeShareCapabilityEquals(
  expected: string | null | undefined,
  provided: string | null | undefined,
): boolean {
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected, "hex");
  const actualBytes = Buffer.from(hashShareCapability(provided), "hex");
  return (
    expectedBytes.length === actualBytes.length &&
    timingSafeEqual(expectedBytes, actualBytes)
  );
}

export async function hasValidShareCapability(
  fileId: string,
  shareId: string | undefined,
  capability: string | undefined,
): Promise<boolean> {
  if (!shareId || !capability) return false;
  const row = await db
    .select({
      capabilityHash: shares.capabilityHash,
      expiresAt: shares.expiresAt,
    })
    .from(shares)
    .where(
      and(
        eq(shares.id, shareId),
        eq(shares.fileId, fileId),
        isNull(shares.revokedAt),
        gt(shares.expiresAt, new Date()),
      ),
    )
    .then((rows) => rows[0]);

  return Boolean(
    row &&
      row.expiresAt &&
      row.expiresAt > new Date() &&
      safeShareCapabilityEquals(row.capabilityHash, capability),
  );
}
