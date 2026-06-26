export async function generateFileKey(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
  return key;
}

export async function encryptFile(
  file: ArrayBuffer,
  key: CryptoKey,
): Promise<{ encData: ArrayBuffer; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    file,
  );
  return { encData, iv };
}

export async function encryptText(
  text: string,
  key: CryptoKey,
): Promise<{ encData: ArrayBuffer; iv: Uint8Array }> {
  const encoded = new TextEncoder().encode(text);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );
  return { encData, iv };
}

export async function decryptFile(
  chipertext: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    chipertext,
  );
}

export async function decryptText(
  encData: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array,
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encData,
  );
  return new TextDecoder().decode(decrypted);
}
