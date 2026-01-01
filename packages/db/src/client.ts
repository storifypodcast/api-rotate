import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Creates a database client with custom connection string
 *
 * @param connectionString - Custom PostgreSQL connection string (optional)
 * @param options - Additional options
 * @returns Drizzle client configured with the schema
 *
 * Note: DATABASE_URL should be validated at app startup via env.ts.
 * This runtime check is a fallback for direct usage.
 */
export function createClient(
  connectionString?: string,
  options?: { prepare?: boolean; timeout?: number },
) {
  const connString = connectionString ?? process.env.DATABASE_URL;

  if (!connString) {
    throw new Error(
      "DATABASE_URL is required. Ensure it's set in your .env file and validated via @api_rotate/db/env",
    );
  }

  const client = postgres(connString, {
    max: process.env.NODE_ENV === "production" ? 20 : 30,
    idle_timeout: 30,
    connect_timeout: options?.timeout ?? 10,
    prepare: options?.prepare ?? true,
  });

  return drizzle({
    client,
    schema,
    casing: "snake_case",
  });
}

/**
 * Singleton database client instance
 *
 * IMPORTANT: In Next.js dev mode, hot reload can recreate the module.
 * We use globalThis to preserve connections between reloads.
 */
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createClient> | undefined;
};

// Skip db creation during build (SKIP_ENV_VALIDATION is set in Docker build)
const shouldSkipDb =
  !!process.env.SKIP_ENV_VALIDATION || !!process.env.CI;

export const db = shouldSkipDb
  ? (undefined as unknown as ReturnType<typeof createClient>)
  : (globalForDb.db ?? createClient());

if (process.env.NODE_ENV !== "production" && !shouldSkipDb) {
  globalForDb.db = db;
}

export type DB = typeof db;
