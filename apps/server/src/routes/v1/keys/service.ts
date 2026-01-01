import type { ApiKey, NewApiKey, UpdateApiKey } from "@api_rotate/db";
import { apiKey, db, eq, sql } from "@api_rotate/db";

interface AvailableKey {
  keyId: string;
  encryptedKey: string;
  keyType: string | null;
}

interface KeyStats {
  totalKeys: number;
  activeKeys: number;
  availableNow: number;
  totalUses: number;
  totalErrors: number;
}

/**
 * Key rotation service using atomic PostgreSQL functions
 */
export class KeyService {
  /**
   * Get first available key (FIFO order by available_at)
   */
  async getFirstAvailableKey(
    typeFilter?: string,
    cooldownSeconds?: number,
  ): Promise<AvailableKey | null> {
    const result = await db.execute<{
      key_id: string;
      encrypted_key: string;
      key_type: string | null;
    }>(
      sql`SELECT * FROM get_first_available_key(${typeFilter ?? null}, ${cooldownSeconds ?? null})`,
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    if (!row) {
      return null;
    }

    return {
      keyId: row.key_id,
      encryptedKey: row.encrypted_key,
      keyType: row.key_type,
    };
  }

  /**
   * Get random available key
   */
  async getRandomAvailableKey(
    typeFilter?: string,
    cooldownSeconds?: number,
  ): Promise<AvailableKey | null> {
    const result = await db.execute<{
      key_id: string;
      encrypted_key: string;
      key_type: string | null;
    }>(
      sql`SELECT * FROM get_random_available_key(${typeFilter ?? null}, ${cooldownSeconds ?? null})`,
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    if (!row) {
      return null;
    }

    return {
      keyId: row.key_id,
      encryptedKey: row.encrypted_key,
      keyType: row.key_type,
    };
  }

  /**
   * Report key error with exponential backoff
   */
  async reportError(
    keyId: string,
    errorMessage?: string,
  ): Promise<boolean> {
    const result = await db.execute<{ report_key_error: boolean }>(
      sql`SELECT report_key_error(${keyId}::uuid, ${errorMessage ?? null})`,
    );

    const row = result[0];
    return row?.report_key_error ?? false;
  }

  /**
   * Get aggregated key statistics
   */
  async getStats(): Promise<KeyStats> {
    const result = await db.execute<{
      total_keys: string;
      active_keys: string;
      available_now: string;
      total_uses: string;
      total_errors: string;
    }>(sql`SELECT * FROM get_api_key_stats()`);

    const row = result[0];
    if (!row) {
      return {
        totalKeys: 0,
        activeKeys: 0,
        availableNow: 0,
        totalUses: 0,
        totalErrors: 0,
      };
    }

    return {
      totalKeys: Number(row.total_keys),
      activeKeys: Number(row.active_keys),
      availableNow: Number(row.available_now),
      totalUses: Number(row.total_uses),
      totalErrors: Number(row.total_errors),
    };
  }

  /**
   * List all keys (without encrypted values for security)
   */
  async listKeys(): Promise<Omit<ApiKey, "encryptedKey">[]> {
    const keys = await db.query.apiKey.findMany({
      columns: {
        encryptedKey: false,
      },
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    return keys;
  }

  /**
   * Get key by ID (without encrypted value)
   */
  async getKeyById(id: string): Promise<Omit<ApiKey, "encryptedKey"> | null> {
    const key = await db.query.apiKey.findFirst({
      columns: {
        encryptedKey: false,
      },
      where: eq(apiKey.id, id),
    });

    return key ?? null;
  }

  /**
   * Create a new key
   */
  async createKey(data: NewApiKey): Promise<ApiKey> {
    const [newKey] = await db.insert(apiKey).values(data).returning();

    if (!newKey) {
      throw new Error("Failed to create key");
    }

    return newKey;
  }

  /**
   * Update an existing key
   */
  async updateKey(
    id: string,
    data: UpdateApiKey,
  ): Promise<Omit<ApiKey, "encryptedKey"> | null> {
    const [updated] = await db
      .update(apiKey)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(apiKey.id, id))
      .returning({
        id: apiKey.id,
        name: apiKey.name,
        type: apiKey.type,
        defaultCooldown: apiKey.defaultCooldown,
        isActive: apiKey.isActive,
        availableAt: apiKey.availableAt,
        lastUsedAt: apiKey.lastUsedAt,
        useCount: apiKey.useCount,
        errorCount: apiKey.errorCount,
        consecutiveErrors: apiKey.consecutiveErrors,
        lastErrorAt: apiKey.lastErrorAt,
        lastErrorMessage: apiKey.lastErrorMessage,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      });

    return updated ?? null;
  }

  /**
   * Delete a key
   */
  async deleteKey(id: string): Promise<boolean> {
    const result = await db.delete(apiKey).where(eq(apiKey.id, id)).returning();

    return result.length > 0;
  }
}

export const keyService = new KeyService();
