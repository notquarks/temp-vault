import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username"),
  displayUsername: text("display_username"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const filelist = sqliteTable("files", {
  id: text("id").primaryKey(),
  name: text("filename"),
  ownerId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  private: integer("is_private").notNull(),
  type: text("file_type").notNull(),
  size: text("string").notNull(),
  isGuest: integer("is_guest", { mode: "boolean" }).notNull().default(false),
  guestAccessHash: text("guest_access_hash"),
  guestIpHash: text("guest_ip_hash"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const guestUploadEvents = sqliteTable(
  "guest_upload_events",
  {
    id: text("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    challengeHash: text("challenge_hash").notNull(),
    size: integer("size_bytes").notNull().default(0),
    status: text("status").notNull().default("started"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("guest_upload_events_ip_created_idx").on(
      table.ipHash,
      table.createdAt,
    ),
    uniqueIndex("guest_upload_events_challenge_idx").on(table.challengeHash),
  ],
);

export const fileKeys = sqliteTable("file_keys", {
  fileId: text("file_id")
    .primaryKey()
    .references(() => filelist.id, { onDelete: "cascade" }),
  iv: text("iv_file").notNull(),
  ivName: text("iv_name").notNull(),
  key: text("enc_key").notNull(),
  wrapIv: text("wrap_iv").notNull(),
});

export const shares = sqliteTable("shares", {
  id: text("id").primaryKey(),
  fileId: text("file_id")
    .notNull()
    .references(() => filelist.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
