import { randomBytes, createHash } from "crypto";

import type { ServiceKey } from "@api_rotate/db";
import { db, eq, and, serviceKey } from "@api_rotate/db";

interface GeneratedServiceKey {
  id: string;
  name: string;
  key: string; // Only returned once at creation
  prefix: string;
  createdAt: Date;
}

/**
 * Generate a cryptographically secure service key
 * Format: sk_live_{32 random hex chars}
 */
function generateServiceKey(): string {
  const randomPart = randomBytes(16).toString("hex");
  return `sk_live_${randomPart}`;
}

/**
 * Hash a service key using SHA-256
 */
function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Extract prefix from service key for display
 * Shows first 12 characters (sk_live_xxxx)
 */
function extractPrefix(key: string): string {
  return key.slice(0, 12);
}

/**
 * Service key management service
 */
export class ServiceKeyService {
  /**
   * Generate a new service key for a user
   */
  async createServiceKey(
    userId: string,
    name: string,
  ): Promise<GeneratedServiceKey> {
    const key = generateServiceKey();
    const keyHash = hashKey(key);
    const keyPrefix = extractPrefix(key);

    const [created] = await db
      .insert(serviceKey)
      .values({
        userId,
        name,
        keyHash,
        keyPrefix,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create service key");
    }

    return {
      id: created.id,
      name: created.name,
      key, // Only returned at creation - not stored
      prefix: keyPrefix,
      createdAt: created.createdAt,
    };
  }

  /**
   * List all service keys for a user (without hash)
   */
  async listServiceKeys(
    userId: string,
  ): Promise<Omit<ServiceKey, "keyHash">[]> {
    const keys = await db.query.serviceKey.findMany({
      columns: {
        keyHash: false,
      },
      where: eq(serviceKey.userId, userId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    return keys;
  }

  /**
   * Revoke (delete) a service key
   */
  async revokeServiceKey(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(serviceKey)
      .where(and(eq(serviceKey.id, id), eq(serviceKey.userId, userId)))
      .returning();

    return result.length > 0;
  }
}

export const serviceKeyService = new ServiceKeyService();
