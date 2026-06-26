import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "../db/schema";

const sqlite = new Database("data/main.db");
const db = drizzle(sqlite, { schema });

export { db, sqlite };
