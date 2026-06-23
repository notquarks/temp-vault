// server/lib/db.ts
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

const sqlite = new Database("data/main.db");
const db = drizzle(sqlite);

export { db, sqlite };
