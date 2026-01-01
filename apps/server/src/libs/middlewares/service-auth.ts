import { createHash } from "crypto";
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

import { db, eq, serviceKey } from "@api_rotate/db";

import { createLogger } from "~/libs/utils/logger";

const log = createLogger("ServiceAuthMiddleware");

export interface ServiceAuthVariables {
  userId: string;
  serviceKeyId: string;
}

/**
 * Hash a service key using SHA-256
 */
function hashServiceKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Service Key authentication middleware
 * Validates Bearer token by looking up hashed key in database
 * Sets userId and serviceKeyId in context
 */
export async function serviceAuthMiddleware(
  c: Context<{ Variables: ServiceAuthVariables }>,
  next: Next,
) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    log.warn("No Authorization header");
    throw new HTTPException(401, {
      message: "Unauthorized - Missing Authorization header",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    log.warn("Invalid Authorization header format");
    throw new HTTPException(401, {
      message: "Unauthorized - Invalid Authorization header format",
    });
  }

  const key = authHeader.slice(7);
  const keyHash = hashServiceKey(key);

  // Lookup service key in database
  const foundKey = await db.query.serviceKey.findFirst({
    where: eq(serviceKey.keyHash, keyHash),
  });

  if (!foundKey) {
    log.warn("Invalid service key");
    throw new HTTPException(401, {
      message: "Unauthorized - Invalid service key",
    });
  }

  // Check if key is active
  if (!foundKey.isActive) {
    log.warn({ keyId: foundKey.id }, "Service key is inactive");
    throw new HTTPException(401, {
      message: "Unauthorized - Service key is inactive",
    });
  }

  // Check expiration
  if (foundKey.expiresAt && foundKey.expiresAt < new Date()) {
    log.warn({ keyId: foundKey.id }, "Service key has expired");
    throw new HTTPException(401, {
      message: "Unauthorized - Service key has expired",
    });
  }

  // Update last used timestamp (fire-and-forget, don't block request)
  db.update(serviceKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(serviceKey.id, foundKey.id))
    .then(() => {
      log.debug({ keyId: foundKey.id }, "Updated service key last used");
    })
    .catch((err) => {
      log.error({ keyId: foundKey.id, error: err }, "Failed to update last used");
    });

  // Set user context
  c.set("userId", foundKey.userId);
  c.set("serviceKeyId", foundKey.id);

  log.debug({ userId: foundKey.userId, keyId: foundKey.id }, "Service authenticated");
  await next();
}
