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

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function upload(
  file: File,
  userId: string,
  options?: UploadOptions,
): Promise<UploadResult> {  if (file.size === 0) {
    throw new UploadError("File is empty", "INVALID_FILE");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError(
      `File exceeds the 50 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
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
  let encDataStr: string;
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
  form.append("userId", userId);

  if (options?.onProgress) {
    return uploadWithXhr(form, options);
  }

  return uploadWithFetch(form, options?.signal);
}

function uploadWithXhr(form: FormData, options: UploadOptions): Promise<UploadResult> {
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
          resolve(data as UploadResult);
        } catch {
          reject(
            new UploadError("Invalid server response", "SERVER_ERROR", xhr.status),
          );
        }
      } else if (xhr.status === 401 || xhr.status === 403) {
        reject(
          new UploadError("Authentication failed — please log in again", "AUTH_ERROR", xhr.status),
        );
      } else {
        reject(
          new UploadError(
            `Server responded with ${xhr.status}`,
            "SERVER_ERROR",
            xhr.status,
          ),
        );
      }
    });

    xhr.addEventListener("error", () => {
      reject(
        new UploadError("Network error — check your connection", "NETWORK_ERROR"),
      );
    });

    xhr.addEventListener("abort", () => {
      reject(new UploadError("Upload cancelled", "ABORTED"));
    });

    xhr.addEventListener("timeout", () => {
      reject(new UploadError("Upload timed out", "TIMEOUT"));
    });

    xhr.open("POST", "/api/files/upload");
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
): Promise<UploadResult> {
  let response: Response;

  try {
    response = await fetch("/api/files/upload", {
      method: "POST",
      body: form,
      signal,
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
      return (await response.json()) as UploadResult;
    } catch {
      throw new UploadError("Invalid server response", "SERVER_ERROR", response.status);
    }
  }

  if (response.status === 401 || response.status === 403) {
    throw new UploadError(
      "Authentication failed — please log in again",
      "AUTH_ERROR",
      response.status,
    );
  }

  let detail: string | undefined;
  try {
    const body = await response.json();
    detail = body.message || body.error || undefined;
  } catch {
  }

  throw new UploadError(
    detail ?? `Server error (${response.status})`,
    "SERVER_ERROR",
    response.status,
  );
}
export async function download(
  fileId: string,
  options?: { signal?: AbortSignal; shareId?: string },
): Promise<{ blobUrl: string; name: string }> {
  try {
    const shareQuery = options?.shareId ? `?shareId=${options.shareId}` : "";
    const metaRes = await fetch(`/api/files/${fileId}/meta${shareQuery}`, {
      signal: options?.signal,
    });

    if (!metaRes.ok) {
      throw new UploadError(
        `Failed to fetch file metadata (${metaRes.status})`,
        "SERVER_ERROR",
        metaRes.status,
      );
    }

    const meta = await metaRes.json();
    const { iv, encrypted_key, enc_name, iv_name, isPrivate } = meta;

    const rawKey = Uint8Array.from(atob(encrypted_key), (c) => c.charCodeAt(0));
    const fileKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );

    const ivNameBytes = Uint8Array.from(atob(iv_name), (c) => c.charCodeAt(0));
    const encNameBytes = Uint8Array.from(atob(enc_name), (c) => c.charCodeAt(0));
    const decryptedName = await decryptText(
      encNameBytes.buffer as ArrayBuffer,
      fileKey,
      ivNameBytes,
    );

    if (isPrivate) {
      const fileRes = await fetch(`/api/files/${fileId}${shareQuery}`, {
        signal: options?.signal,
      });
      if (!fileRes.ok) {
        throw new UploadError(`Failed to fetch file (${fileRes.status})`, "SERVER_ERROR", fileRes.status);
      }
      const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
      const encData = await fileRes.arrayBuffer();
      const fileBuffer = await decryptFile(encData, fileKey, ivBytes);
      const blob = new Blob([fileBuffer]);
      const blobUrl = URL.createObjectURL(blob);
      return { blobUrl, name: decryptedName };
    }

    const ext = decryptedName.split('.').pop()?.toLowerCase() || "";
    const cdnUrl = `https://cdn.arkivio.my.id/${fileId}${ext ? '.' + ext : ''}${shareQuery}`;

    return { blobUrl: cdnUrl, name: decryptedName };
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
      } catch {
      }

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

export async function togglePrivacy(fileId: string, isPrivate: boolean): Promise<boolean> {
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
