import { Buffer } from "node:buffer";
import { handle } from "hono/cloudflare-pages";
import app from "../../server/src/app";

export const onRequest = (context: any) => {
  if (typeof globalThis.Buffer === "undefined") {
    globalThis.Buffer = Buffer;
  }
  if (typeof globalThis.process === "undefined") {
    globalThis.process = { env: context.env } as any;
  } else {
    Object.assign(globalThis.process.env, context.env);
  }

  return handle(app)(context);
};
