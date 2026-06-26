import { Hono } from "hono";
import { cors } from "hono/cors";
import { rateLimiter } from "hono-rate-limiter";
import { auth } from "../lib/auth";
import { cleanupOldFiles } from "../lib/cleanup";
import routes from "../routes";

const app = new Hono();

app.use(
  "/api/auth/*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

let limiter: ReturnType<typeof rateLimiter>;

app.use("/api/*", async (c, next) => {
  if (!limiter) {
    limiter = rateLimiter({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-6",
      keyGenerator: (c) => {
        const ip =
          c.req.header("cf-connecting-ip") ||
          c.req.header("x-forwarded-for") ||
          "unknown-ip";
        return ip.split(",")[0].trim();
      },
    });
  }
  return limiter(c, next);
});

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api", routes);

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
