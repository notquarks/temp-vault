import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "../lib/auth";
import routes from "../routes";

const app = new Hono();

app.use(
  "/api/auth/*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api", routes);

app.get("/api/health", (c) => c.json({ status: "ok" }));

export default app;

Bun.serve({
  fetch: app.fetch,
  port: 3000,
});

console.log("Arkivio server running on http://localhost:3000");
