// server/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "../lib/auth";

const app = new Hono();

app.use(
  "/api/auth/*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/api/test", (c) => {
  return c.json({ message: "Hello from the server!" });
});

// Start listening
Bun.serve({
  fetch: app.fetch,
  port: 3000,
});

console.log("Arkivio server running on http://localhost:3000");
