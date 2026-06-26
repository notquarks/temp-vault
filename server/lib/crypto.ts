import { createCipheriv, createDecipheriv, createHash } from "node:crypto";

const GCM_TAG_LEN = 16;

let _masterKey: Buffer | undefined;
let _oldMasterKey: Buffer | null | undefined;

function getMasterKey(): Buffer {
  if (!_masterKey) {
    const raw =
      process.env.MASTER_KEY || "arkivio-local-dev-key-change-in-production";
    _masterKey = createHash("sha256").update(raw).digest();
  }
  return _masterKey;
}

function getOldMasterKey(): Buffer | null {
  if (_oldMasterKey === undefined) {
    try {
      const k = Buffer.from(process.env.MASTER_KEY || "", "hex");
      _oldMasterKey = k.length === 32 ? k : null;
    } catch {
      _oldMasterKey = null;
    }
  }
  return _oldMasterKey;
}

export function wrappedKey(rawKey: ArrayBuffer, iv: Uint8Array): Buffer {
  const cipher = createCipheriv("aes-256-gcm", getMasterKey(), iv);
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
    return tryUnwrap(wrapped, iv, getMasterKey());
  } catch {
    const old = getOldMasterKey();
    if (!old) throw new Error("Key mismatch");
    return tryUnwrap(wrapped, iv, old);
  }
}
