import { Hono } from "hono";
import { cors } from "hono/cors";
import { rateLimiter } from "hono-rate-limiter";
import { auth } from "../lib/auth";
import { cleanupOldFiles } from "../lib/cleanup";
import routes from "../routes";
import { clientIp } from "../lib/guest-security";

const app = new Hono();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.VITE_BACKEND_URL,
  process.env.VITE_APP_URL,
].filter((value): value is string => Boolean(value));

app.use(
  "/api/auth/*",
  cors({
    origin: (origin) =>
      allowedOrigins.includes(origin) ? origin : "",
    credentials: true,
  }),
);

app.use("/api/*", async (c, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method)) {
    const origin = c.req.header("origin");
    const fetchSite = c.req.header("sec-fetch-site");
    if (
      (origin && !allowedOrigins.includes(origin)) ||
      fetchSite === "cross-site"
    ) {
      return c.json({ error: "Cross-site mutation rejected" }, 403);
    }
  }
  return next();
});

let limiter: ReturnType<typeof rateLimiter>;

app.use("/api/*", async (c, next) => {
  if (!limiter) {
    limiter = rateLimiter({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-6",
      keyGenerator: (c) => clientIp(c as any) || "unresolved-ip",
    });
  }
  return (limiter as any)(c, next);
});

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw) as any);

app.route("/api", routes as any);

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.get("/api/cron/cleanup", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await cleanupOldFiles();
  return c.json({ status: "success", message: "Cleanup completed" });
});

export default app;
