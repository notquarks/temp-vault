import {
  decryptFile,
  decryptText,
  encryptFile,
  encryptText,
  generateFileKey,
} from "./crypto";
export interface UploadResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  isGuest?: boolean;
  guestAccessToken?: string;
}

export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export class UploadError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NETWORK_ERROR"
      | "TIMEOUT"
      | "ABORTED"
      | "AUTH_ERROR"
      | "SERVER_ERROR"
      | "ENCRYPTION_ERROR"
      | "FILE_TOO_LARGE"
      | "INVALID_FILE",
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

export const AUTHENTICATED_MAX_FILE_SIZE = 50 * 1024 * 1024;
export const GUEST_MAX_FILE_SIZE = 20 * 1024 * 1024;

interface GuestProof {
  challenge: string;
  solution: string;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      window.clearTimeout(timeout);
      reject(new UploadError("Upload cancelled", "ABORTED"));
    };
    const timeout = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function hasLeadingZeroBits(bytes: Uint8Array, bits: number): boolean {
  const fullBytes = Math.floor(bits / 8);
  for (let i = 0; i < fullBytes; i++) if (bytes[i] !== 0) return false;
  const remaining = bits % 8;
  return remaining === 0 || bytes[fullBytes] >> (8 - remaining) === 0;
}

async function createGuestProof(signal?: AbortSignal): Promise<GuestProof> {
  const response = await fetch("/api/files/guest-challenge", {
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new UploadError(
      body.error || "Guest upload verification is unavailable",
      "SERVER_ERROR",
      response.status,
    );
  }
  const { challenge, difficulty, minWaitMs, expiresAt } = await response.json();
  if (
    typeof challenge !== "string" ||
    !Number.isInteger(difficulty) ||
    !Number.isInteger(minWaitMs) ||
    typeof expiresAt !== "number"
  ) {
    throw new UploadError(
      "Invalid guest verification challenge",
      "SERVER_ERROR",
    );
  }

  const encoder = new TextEncoder();
  for (let nonce = 0; Date.now() < expiresAt; nonce++) {
    if (signal?.aborted) throw new UploadError("Upload cancelled", "ABORTED");
    const digest = new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(`${challenge}:${nonce}`),
      ),
    );
    if (hasLeadingZeroBits(digest, difficulty)) {
      const issuedAt = Number(challenge.split(".")[0]);
      await wait(issuedAt + minWaitMs - Date.now(), signal);
      return { challenge, solution: String(nonce) };
    }
  }
  throw new UploadError("Guest verification challenge expired", "TIMEOUT");
}

function rememberGuestAccess(result: UploadResult): UploadResult {
  if (result.guestAccessToken) {
    try {
      sessionStorage.setItem(
        `arkivio:guest-access:${result.fileId}`,
        result.guestAccessToken,
      );
    } catch {}
  }
  return result;
}

function guestAccessHeaders(fileId: string): HeadersInit | undefined {
  try {
    const token = sessionStorage.getItem(`arkivio:guest-access:${fileId}`);
    return token ? { "X-Guest-Access-Token": token } : undefined;
  } catch {
    return undefined;
  }
}

export async function upload(
  file: File,
  userId?: string,
  options?: UploadOptions,
): Promise<UploadResult> {
  if (file.size === 0) {
    throw new UploadError("File is empty", "INVALID_FILE");
  }
  const maxFileSize = userId
    ? AUTHENTICATED_MAX_FILE_SIZE
    : GUEST_MAX_FILE_SIZE;
  if (file.size > maxFileSize) {
    throw new UploadError(
      `File exceeds the ${maxFileSize / 1024 / 1024} MB ${userId ? "account" : "guest"} limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
      "FILE_TOO_LARGE",
    );
  }
  let fileBuffer: ArrayBuffer;
  try {
    fileBuffer = await file.arrayBuffer();
  } catch (err) {
    throw new UploadError(
      "Failed to read file data",
      "ENCRYPTION_ERROR",
      undefined,
      err,
    );
  }

  let generatedKey: CryptoKey;
  let encData: ArrayBuffer;
  let iv: Uint8Array;
  let encName: ArrayBuffer;
  let ivName: Uint8Array;
  let rawKey: ArrayBuffer;
  let keyBase64: string;
  let encNameB64: string;

  try {
    generatedKey = await generateFileKey();
    ({ encData, iv } = await encryptFile(fileBuffer, generatedKey));
    ({ encData: encName, iv: ivName } = await encryptText(
      file.name,
      generatedKey,
    ));
    encNameB64 = btoa(String.fromCharCode(...new Uint8Array(encName)));
    rawKey = await crypto.subtle.exportKey("raw", generatedKey);
    keyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
  } catch (err) {
    throw new UploadError(
      "Encryption failed — unable to secure file",
      "ENCRYPTION_ERROR",
      undefined,
      err,
    );
  }
  const form = new FormData();
  form.append("file", new Blob([encData]), encNameB64);
  form.append("iv", btoa(String.fromCharCode(...iv)));
  form.append("enc_name", encNameB64);
  form.append("iv_name", btoa(String.fromCharCode(...ivName)));
  form.append("key", keyBase64);
  form.append("filetype", file.type || "application/octet-stream");
  form.append("filesize", file.size.toString());
  const guestProof = userId
    ? undefined
    : await createGuestProof(options?.signal);

  if (options?.onProgress) {
    return uploadWithXhr(form, options, guestProof);
  }

  return uploadWithFetch(form, options?.signal, guestProof);
}

function uploadWithXhr(
  form: FormData,
  options: UploadOptions,
  guestProof?: GuestProof,
): Promise<UploadResult> {
  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && options.onProgress) {
        options.onProgress({
          percent: Math.round((e.loaded / e.total) * 100),
          loaded: e.loaded,
          total: e.total,
        });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(rememberGuestAccess(data as UploadResult));
        } catch {
          reject(
            new UploadError(
              "Invalid server response",
              "SERVER_ERROR",
              xhr.status,
            ),
          );
        }
      } else {
        let detail: string | undefined;
        try {
          const body = JSON.parse(xhr.responseText);
          detail = body.message || body.error;
        } catch {}
        reject(
          new UploadError(
            detail || `Server responded with ${xhr.status}`,
            xhr.status === 401 || xhr.status === 403
              ? "AUTH_ERROR"
              : "SERVER_ERROR",
            xhr.status,
          ),
        );
      }
    });

    xhr.addEventListener("error", () => {
      reject(
        new UploadError(
          "Network error — check your connection",
          "NETWORK_ERROR",
        ),
      );
    });

    xhr.addEventListener("abort", () => {
      reject(new UploadError("Upload cancelled", "ABORTED"));
    });

    xhr.addEventListener("timeout", () => {
      reject(new UploadError("Upload timed out", "TIMEOUT"));
    });

    xhr.open("POST", "/api/files/upload");
    if (guestProof) {
      xhr.setRequestHeader("X-Guest-Challenge", guestProof.challenge);
      xhr.setRequestHeader("X-Guest-Proof", guestProof.solution);
    }
    xhr.timeout = 5 * 60 * 1000;

    if (options.signal) {
      options.signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.send(form);
  });
}

async function uploadWithFetch(
  form: FormData,
  signal?: AbortSignal,
  guestProof?: GuestProof,
): Promise<UploadResult> {
  let response: Response;

  try {
    response = await fetch("/api/files/upload", {
      method: "POST",
      body: form,
      signal,
      headers: guestProof
        ? {
            "X-Guest-Challenge": guestProof.challenge,
            "X-Guest-Proof": guestProof.solution,
          }
        : undefined,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new UploadError("Upload cancelled", "ABORTED");
    }
    throw new UploadError(
      "Network error — check your connection",
      "NETWORK_ERROR",
      undefined,
      err,
    );
  }

  if (response.ok) {
    try {
      return rememberGuestAccess((await response.json()) as UploadResult);
    } catch {
      throw new UploadError(
        "Invalid server response",
        "SERVER_ERROR",
        response.status,
      );
    }
  }

  let detail: string | undefined;
  try {
    const body = await response.json();
    detail = body.message || body.error || undefined;
  } catch {}

  throw new UploadError(
    detail ?? `Server error (${response.status})`,
    "SERVER_ERROR",
    response.status,
  );
}
export async function download(
  fileId: string,
  options?: {
    signal?: AbortSignal;
    shareId?: string;
    decryptionKey?: string;
  },
): Promise<{
  blobUrl: string;
  name: string;
  fileKey: CryptoKey;
  canShare: boolean;
}> {
  try {
    const shareQuery = options?.shareId ? `?shareId=${options.shareId}` : "";
    const metaRes = await fetch(`/api/files/${fileId}/meta${shareQuery}`, {
      signal: options?.signal,
      headers: guestAccessHeaders(fileId),
    });

    if (!metaRes.ok) {
      throw new UploadError(
        `Failed to fetch file metadata (${metaRes.status})`,
        "SERVER_ERROR",
        metaRes.status,
      );
    }

    const meta = await metaRes.json();
    const { iv, encrypted_key, enc_name, iv_name, fileType, canShare } = meta;

    const encodedKey = options?.decryptionKey
      ? options.decryptionKey.replace(/-/g, "+").replace(/_/g, "/")
      : encrypted_key;
    const paddedKey = encodedKey.padEnd(
      encodedKey.length + ((4 - (encodedKey.length % 4)) % 4),
      "=",
    );
    const rawKey = Uint8Array.from(atob(paddedKey), (c) => c.charCodeAt(0));
    const fileKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["decrypt"],
    );

    const ivNameBytes = Uint8Array.from(atob(iv_name), (c) => c.charCodeAt(0));
    const encNameBytes = Uint8Array.from(atob(enc_name), (c) =>
      c.charCodeAt(0),
    );
    const decryptedName = await decryptText(
      encNameBytes.buffer as ArrayBuffer,
      fileKey,
      ivNameBytes,
    );

    const fileRes = await fetch(`/api/files/${fileId}${shareQuery}`, {
      signal: options?.signal,
      headers: guestAccessHeaders(fileId),
    });
    if (!fileRes.ok) {
      throw new UploadError(
        `Failed to fetch file (${fileRes.status})`,
        "SERVER_ERROR",
        fileRes.status,
      );
    }
    const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
    const encData = await fileRes.arrayBuffer();
    const fileBuffer = await decryptFile(encData, fileKey, ivBytes);
    const blob = new Blob([fileBuffer], {
      type:
        typeof fileType === "string" && fileType
          ? fileType
          : "application/octet-stream",
    });
    return {
      blobUrl: URL.createObjectURL(blob),
      name: decryptedName,
      fileKey,
      canShare: canShare === true,
    };
  } catch (err) {
    if (err instanceof UploadError) throw err;
    throw new UploadError(
      "Failed to retrieve file",
      "NETWORK_ERROR",
      undefined,
      err,
    );
  }
}
export async function createShareLink(
  fileId: string,
  fileKey: CryptoKey,
): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", fileKey);
  const keyB64 = btoa(String.fromCharCode(...new Uint8Array(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("/api/share/create", {
    method: "POST",
    body: JSON.stringify({ fileId }),
  });

  if (!res.ok) {
    throw new UploadError(
      `Failed to create share link (${res.status})`,
      "SERVER_ERROR",
      res.status,
    );
  }

  const { shareId } = await res.json();
  return `${window.location.origin}/share/${shareId}#key=${keyB64}`;
}
export interface FileRecord {
  id: string;
  userId: string;
  encName: string;
  iv: string;
  ivName: string;
  fileSize: number;
  fileType: string;
  encryptedKey: string;
  uploadedAt: string;
  decryptedName?: string;
  isPrivate: boolean;
}

export async function getUserFiles(userId: string): Promise<FileRecord[]> {
  const response = await fetch(`/api/files/user/${userId}`);

  if (!response.ok) {
    throw new UploadError(
      `Failed to fetch files (${response.status})`,
      "SERVER_ERROR",
      response.status,
    );
  }

  const { data } = await response.json();
  return Promise.all(
    data.map(async (file: any) => {
      let decryptedName = "[unable to decrypt name]";
      try {
        if (file.key && file.ivName && file.name) {
          const rawKey = Uint8Array.from(atob(file.key), (c) =>
            c.charCodeAt(0),
          );
          const fileKey = await crypto.subtle.importKey(
            "raw",
            rawKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"],
          );
          const ivNameBytes = Uint8Array.from(atob(file.ivName), (c) =>
            c.charCodeAt(0),
          );
          const encNameBytes = Uint8Array.from(atob(file.name), (c) =>
            c.charCodeAt(0),
          );
          decryptedName = await decryptText(
            encNameBytes.buffer as ArrayBuffer,
            fileKey,
            ivNameBytes,
          );
        }
      } catch {}

      return {
        id: file.id,
        userId: file.ownerId,
        encName: file.name,
        iv: file.iv,
        ivName: file.ivName,
        fileSize: parseInt(file.size, 10),
        fileType: file.type,
        encryptedKey: file.key,
        uploadedAt: file.createdAt,
        decryptedName,
        isPrivate: file.private === 1,
      };
    }),
  );
}
export async function deleteFile(fileId: string): Promise<void> {
  const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });

  if (!res.ok) {
    throw new UploadError(
      `Failed to delete file (${res.status})`,
      "SERVER_ERROR",
      res.status,
    );
  }
}

export async function togglePrivacy(
  fileId: string,
  isPrivate: boolean,
): Promise<boolean> {
  const res = await fetch(`/api/files/${fileId}/privacy`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isPrivate }),
  });

  if (!res.ok) {
    throw new UploadError(
      `Failed to update privacy (${res.status})`,
      "SERVER_ERROR",
      res.status,
    );
  }

  const data = await res.json();
  return data.private;
}
