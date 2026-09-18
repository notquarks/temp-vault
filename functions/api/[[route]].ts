import { Buffer } from "node:buffer";
import { handle } from "hono/cloudflare-pages";

export const onRequest = async (context: any) => {
  if (typeof globalThis.Buffer === "undefined") {
    globalThis.Buffer = Buffer;
  }
  if (typeof globalThis.process === "undefined") {
    globalThis.process = { env: context.env } as any;
  } else {
    Object.assign(globalThis.process.env, context.env);
  }

  const { default: app } = await import("../../server/src/app");
  return handle(app as any)(context);
};
