import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "../db/schema";

let _auth: ReturnType<typeof betterAuth>;

export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_, prop) {
    if (!_auth) {
      _auth = betterAuth({
        database: drizzleAdapter(db, {
          provider: "sqlite",
          schema,
        }),
        plugins: [username()],
        emailAndPassword: {
          enabled: true,
          autoSignIn: false,
          requireEmailVerification: false,
        },
        trustedOrigins: ["http://localhost:5173"],
      });
    }
    const value = _auth[prop as keyof typeof _auth];
    return typeof value === "function" ? value.bind(_auth) : value;
  },
});
