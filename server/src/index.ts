import { Hono } from "hono";
import { cors } from "hono/cors";
import { rateLimiter } from "hono-rate-limiter";
import { getConnInfo } from "hono/bun";
import { auth } from "../lib/auth";
import { startCleanupCron } from "../lib/cleanup";
import routes from "../routes";

const app = new Hono();

app.use(
  "/api/auth/*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(
  "/api/*",
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-6",
    keyGenerator: (c) => {
      const info = getConnInfo(c);
      return info?.remote?.address || "unknown-ip";
    },
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api", routes);

app.get("/api/health", (c) => c.json({ status: "ok" }));

export default app;

// Start background task to clean up 30-day old files
startCleanupCron();

Bun.serve({
  fetch: app.fetch,
  port: 3000,
});

console.log("Arkivio server running on http://localhost:3000");
