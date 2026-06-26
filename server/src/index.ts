import app from "./app";
import { startCleanupCron } from "../lib/cleanup";

startCleanupCron();

Bun.serve({
  fetch: app.fetch,
  port: 3000,
});

console.log("Arkivio server running on http://localhost:3000");
