import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "../auth/user";

/**
 * Stores encryption key validation info per user
 * Used to verify that a user is using their correct encryption key
 */
export const encryptionKeyInfo = pgTable("encryption_key_info", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),

  // Owner (one record per user)
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),

  // SHA-256 fingerprint of the primary encryption key (hex encoded, 64 chars)
  keyFingerprint: text("key_fingerprint").notNull(),

  // Encrypted validation token - a known value encrypted with the key
  // Used to verify the key is correct on unlock
  validationToken: text("validation_token").notNull(),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
