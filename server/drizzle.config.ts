import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { join } from "path";

config({ path: join(__dirname, "../.env") });

export default defineConfig({
  dialect: "turso",
  schema: "./db/schema.ts",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
