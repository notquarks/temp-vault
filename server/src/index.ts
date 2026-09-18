import app from "./app";
import { startCleanupCron } from "../lib/cleanup";

startCleanupCron();

const port = Number(process.env.PORT || 3005);

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`Arkivio server running on http://localhost:${port}`);
