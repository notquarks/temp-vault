import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../db/schema";
import path from "node:path";

let _db: ReturnType<typeof drizzle>;
let _sqlite: ReturnType<typeof createClient>;

function getInstances() {
  if (!_sqlite) {
    const isLocal = typeof process !== "undefined" && !!(process.versions?.node || process.versions?.bun);
    
    _sqlite = createClient({
      url: isLocal 
        ? `file:${path.join(__dirname, "../data/main.db")}` 
        : process.env.TURSO_DATABASE_URL!,
      authToken: isLocal ? undefined : process.env.TURSO_AUTH_TOKEN,
    });
    _db = drizzle(_sqlite, { schema });
  }
  return { db: _db, sqlite: _sqlite };
}

const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    const target = getInstances().db;
    const value = target[prop as keyof typeof target];
    return typeof value === "function" ? value.bind(target) : value;
  },
});

const sqlite = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    const target = getInstances().sqlite;
    const value = target[prop as keyof typeof target];
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export { db, sqlite };
