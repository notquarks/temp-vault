import { createCipheriv, createDecipheriv, createHash } from "node:crypto";

const raw = process.env.MASTER_KEY || "arkivio-local-dev-key-change-in-production";
const masterKey = createHash("sha256").update(raw).digest();

const oldMasterKey = (() => {
  try {
    const k = Buffer.from(process.env.MASTER_KEY || "", "hex");
    return k.length === 32 ? k : null;
  } catch {
    return null;
  }
})();

const GCM_TAG_LEN = 16;

export function wrappedKey(rawKey: ArrayBuffer, iv: Uint8Array): Buffer {
  const cipher = createCipheriv("aes-256-gcm", masterKey, iv);
  const ciphertext = cipher.update(Buffer.from(rawKey));
  cipher.final();
  const tag = cipher.getAuthTag();
  return Buffer.concat([ciphertext, tag]);
}

function tryUnwrap(wrapped: Buffer, iv: Uint8Array, key: Buffer): Buffer {
  const tag = wrapped.subarray(-GCM_TAG_LEN);
  const data = wrapped.subarray(0, -GCM_TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = decipher.update(data);
  decipher.final();
  return plaintext;
}

export function unwrapKey(wrapped: Buffer, iv: Uint8Array): Buffer {
  try {
    return tryUnwrap(wrapped, iv, masterKey);
  } catch {
    if (!oldMasterKey) throw new Error("Key mismatch");
    return tryUnwrap(wrapped, iv, oldMasterKey);
  }
}
