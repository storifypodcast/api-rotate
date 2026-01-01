import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "../auth/user";

/**
 * Service keys for programmatic API access.
 * Each user can have multiple service keys.
 * The actual key is hashed (SHA-256) before storage.
 */
export const serviceKey = pgTable(
  "service_key",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),

    // Owner
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Key metadata
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(), // SHA-256 hash of the full key
    keyPrefix: text("key_prefix").notNull(), // First 8 chars for display (sk_abc123...)

    // State
    isActive: boolean("is_active").notNull().default(true),

    // Tracking
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }), // Optional expiration
  },
  (table) => [
    // Fast lookup by key hash (for authentication)
    index("service_key_hash_idx").on(table.keyHash),
    // User's service keys
    index("service_key_user_idx").on(table.userId),
    // Unique name per user
    unique("service_key_user_name_unique").on(table.userId, table.name),
  ],
);
