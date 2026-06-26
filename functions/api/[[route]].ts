import { handle } from "hono/cloudflare-pages";
import app from "../../server/src/app";

export const onRequest = (context: any) => {
  // Polyfill process.env for Cloudflare so our global db.ts works without refactoring
  if (typeof globalThis.process === "undefined") {
    globalThis.process = { env: context.env } as any;
  } else {
    Object.assign(globalThis.process.env, context.env);
  }
  
  return handle(app)(context);
};
