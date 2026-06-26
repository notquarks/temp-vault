import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/web";
import * as schema from "../db/schema";

const sqlite = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:data/main.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(sqlite, { schema });

export { db, sqlite };
