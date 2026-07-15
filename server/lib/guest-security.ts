import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import type { Context } from "hono";
import { guestUploadEvents } from "../db/schema";
import { db } from "./db";

export const GUEST_FILE_LIMIT = 20 * 1024 * 1024;
export const AUTHENTICATED_FILE_LIMIT = 50 * 1024 * 1024;
export const GUEST_UPLOADS_PER_15_MINUTES = 3;
export const GUEST_UPLOADS_PER_DAY = 10;
export const GUEST_BYTES_PER_DAY = 25 * 1024 * 1024;

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const CHALLENGE_MIN_AGE_MS = 1_500;
const PROOF_DIFFICULTY = 15;

function securitySecret(): string {
  const secret =
    process.env.GUEST_SECURITY_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("Guest security secret is not configured");
  return secret;
}

export function clientIp(c: Context): string | null {
  const cloudflareIp = c.req.header("cf-connecting-ip");
  if (cloudflareIp) return cloudflareIp.trim();

  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const forwarded = c.req.header("x-forwarded-for");
    const proxyIp = c.req.header("x-real-ip") || forwarded?.split(",")[0];
    if (proxyIp) return proxyIp.trim();
  }

  if (process.env.NODE_ENV !== "production") return "127.0.0.1";
  return null;
}

export function hashIp(ip: string): string {
  return createHmac("sha256", securitySecret())
    .update(`ip:${ip}`)
    .digest("hex");
}

export function hashCapability(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeHashEquals(
  expected: string | null,
  token: string,
): boolean {
  if (!expected || !token) return false;
  const actual = hashCapability(token);
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(actual, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function issueGuestChallenge(ipHash: string) {
  const issuedAt = Date.now();
  const nonce = Buffer.from(
    crypto.getRandomValues(new Uint8Array(18)),
  ).toString("base64url");
  const payload = `${issuedAt}.${nonce}.${ipHash}`;
  const signature = createHmac("sha256", securitySecret())
    .update(payload)
    .digest("base64url");
  return {
    challenge: `${issuedAt}.${nonce}.${signature}`,
    difficulty: PROOF_DIFFICULTY,
    minWaitMs: CHALLENGE_MIN_AGE_MS,
    expiresAt: issuedAt + CHALLENGE_TTL_MS,
  };
}

function hasLeadingZeroBits(bytes: Uint8Array, bits: number): boolean {
  const fullBytes = Math.floor(bits / 8);
  for (let i = 0; i < fullBytes; i++) if (bytes[i] !== 0) return false;
  const remaining = bits % 8;
  return remaining === 0 || bytes[fullBytes] >> (8 - remaining) === 0;
}

export async function verifyAndReserveGuestUpload(
  ipHash: string,
  challenge: string | undefined,
  solution: string | undefined,
): Promise<{ eventId: string } | { error: string; status: 400 | 409 | 429 }> {
  if (!challenge || !solution || !/^\d+$/.test(solution)) {
    return { error: "Guest proof is required", status: 400 };
  }

  const parts = challenge.split(".");
  if (parts.length !== 3) return { error: "Invalid guest proof", status: 400 };
  const [issuedRaw, nonce, providedSignature] = parts;
  const issuedAt = Number(issuedRaw);
  const age = Date.now() - issuedAt;
  if (!Number.isSafeInteger(issuedAt) || age < CHALLENGE_MIN_AGE_MS) {
    return { error: "Guest proof was submitted too quickly", status: 429 };
  }
  if (age > CHALLENGE_TTL_MS) {
    return { error: "Guest proof expired", status: 400 };
  }

  const expectedSignature = createHmac("sha256", securitySecret())
    .update(`${issuedAt}.${nonce}.${ipHash}`)
    .digest("base64url");
  const expectedBytes = Buffer.from(expectedSignature);
  const providedBytes = Buffer.from(providedSignature);
  if (
    expectedBytes.length !== providedBytes.length ||
    !timingSafeEqual(expectedBytes, providedBytes)
  ) {
    return { error: "Invalid guest proof", status: 400 };
  }

  const proofHash = createHash("sha256")
    .update(`${challenge}:${solution}`)
    .digest();
  if (!hasLeadingZeroBits(proofHash, PROOF_DIFFICULTY)) {
    return { error: "Invalid guest proof", status: 400 };
  }

  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [recent] = await db
    .select({ count: sql<number>`count(*)` })
    .from(guestUploadEvents)
    .where(
      and(
        eq(guestUploadEvents.ipHash, ipHash),
        gte(guestUploadEvents.createdAt, fifteenMinutesAgo),
      ),
    );
  if (Number(recent?.count ?? 0) >= GUEST_UPLOADS_PER_15_MINUTES) {
    return { error: "Guest upload rate limit reached", status: 429 };
  }

  const [daily] = await db
    .select({
      count: sql<number>`count(*)`,
      bytes: sql<number>`coalesce(sum(${guestUploadEvents.size}), 0)`,
    })
    .from(guestUploadEvents)
    .where(
      and(
        eq(guestUploadEvents.ipHash, ipHash),
        gte(guestUploadEvents.createdAt, dayAgo),
      ),
    );
  if (Number(daily?.count ?? 0) >= GUEST_UPLOADS_PER_DAY) {
    return { error: "Daily guest upload limit reached", status: 429 };
  }
  if (Number(daily?.bytes ?? 0) >= GUEST_BYTES_PER_DAY) {
    return { error: "Daily guest storage limit reached", status: 429 };
  }

  const eventId = crypto.randomUUID();
  try {
    await db.insert(guestUploadEvents).values({
      id: eventId,
      ipHash,
      challengeHash: hashCapability(challenge),
      size: 0,
      status: "started",
      createdAt: now,
    });
  } catch {
    return { error: "Guest proof has already been used", status: 409 };
  }
  return { eventId };
}
