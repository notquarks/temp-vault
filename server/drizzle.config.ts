import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { join } from "path";

config({ path: join(__dirname, ".env") });

const isLocal = !process.env.TURSO_DATABASE_URL;

export default defineConfig({
  dialect: isLocal ? "sqlite" : "turso",
  out: "./drizzle",
  schema: "./db/schema.ts",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || "file:./data/main.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
