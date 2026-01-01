import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "../auth/user";

export const apiKey = pgTable(
  "api_key",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),

    // Owner
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Key identification
    name: text("name").notNull(),
    encryptedKey: text("encrypted_key").notNull(), // AES-GCM encrypted, base64 encoded
    type: text("type"), // Optional categorization (e.g., "openai", "anthropic", "gemini")

    // Encryption key fingerprint (SHA-256 hash of the encryption key used)
    // Null for legacy keys created before fingerprinting was added
    keyFingerprint: text("key_fingerprint"),

    // Rate limiting
    defaultCooldown: integer("default_cooldown").notNull().default(30), // Per-key default cooldown in seconds

    // State management
    isActive: boolean("is_active").notNull().default(true),
    availableAt: timestamp("available_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    // Usage tracking
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    useCount: bigint("use_count", { mode: "number" }).notNull().default(0),

    // Error tracking for exponential backoff
    errorCount: bigint("error_count", { mode: "number" }).notNull().default(0),
    consecutiveErrors: integer("consecutive_errors").notNull().default(0),
    lastErrorAt: timestamp("last_error_at", { withTimezone: true }),
    lastErrorMessage: text("last_error_message"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Index for efficient key selection queries (user-scoped)
    index("api_key_user_idx").on(table.userId),
    index("api_key_user_available_idx").on(table.userId, table.availableAt),
    index("api_key_user_type_available_idx").on(
      table.userId,
      table.type,
      table.availableAt,
    ),
  ],
);
