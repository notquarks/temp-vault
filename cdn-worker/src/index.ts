export interface Env {
  BUCKET: R2Bucket;
  API_URL: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.slice(1);

    if (!path || path === "favicon.ico") {
      return new Response("Not Found", { status: 404 });
    }

    const fileId = path.split(".")[0];
    if (!fileId) return new Response("Not Found", { status: 404 });

    try {
      const fetchHeaders = new Headers();

      const cookie = request.headers.get("Cookie");
      if (cookie) fetchHeaders.set("Cookie", cookie);

      const auth = request.headers.get("Authorization");
      if (auth) fetchHeaders.set("Authorization", auth);

      const metaReq = new Request(`${env.API_URL}/api/files/${fileId}/meta${url.search}`, {
        headers: fetchHeaders,
      });

      const metaRes = await fetch(metaReq);
      if (!metaRes.ok) {
        return new Response(await metaRes.text(), { status: metaRes.status });
      }

      const meta = (await metaRes.json()) as any;
      const { iv, encrypted_key, enc_name } = meta;

      let r2Object = await env.BUCKET.get(fileId);
      if (!r2Object) {
        r2Object = await env.BUCKET.get(enc_name);
        if (!r2Object) {
          return new Response("File not found", { status: 404 });
        }
      }

      const encryptedContent = await r2Object.arrayBuffer();

      const rawKey = Uint8Array.from(atob(encrypted_key), (c) =>
        c.charCodeAt(0),
      );
      const fileKey = await crypto.subtle.importKey(
        "raw",
        rawKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"],
      );

      const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        fileKey,
        encryptedContent,
      );

      const ext = path.split(".").pop()?.toLowerCase();
      let contentType = "application/octet-stream";

      if (ext === "png") contentType = "image/png";
      else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
      else if (ext === "gif") contentType = "image/gif";
      else if (ext === "webp") contentType = "image/webp";
      else if (ext === "svg") contentType = "image/svg+xml";
      else if (ext === "mp4") contentType = "video/mp4";

      return new Response(decryptedBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (e: any) {
      console.error(e);
      return new Response(`Internal Server Error: ${e.message || e.toString()}`, { status: 500 });
    }
  },
};
