import { sql } from "drizzle-orm";
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

export const apiKey = pgTable(
  "api_key",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),

    // Key identification
    name: text("name").notNull().unique(),
    encryptedKey: text("encrypted_key").notNull(), // AES-GCM encrypted, base64 encoded
    type: text("type"), // Optional categorization (e.g., "openai", "anthropic", "gemini")

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
      .notNull()
      .$onUpdateFn(() => sql`now()`),
  },
  (table) => [
    // Index for efficient key selection queries
    index("api_key_available_idx").on(table.availableAt),
    index("api_key_type_available_idx").on(table.type, table.availableAt),
  ],
);
