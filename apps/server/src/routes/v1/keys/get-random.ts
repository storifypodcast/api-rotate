import type { Context } from "hono";

import { getKeyOptionsSchema } from "@api_rotate/db";
import { errorResponse, successResponse } from "~/libs/utils/response";

import { keyService } from "./service";

/**
 * GET /keys/random - Get random available key
 * Service auth required
 */
export async function getRandomKey(c: Context) {
  const query = c.req.query();

  const parsed = getKeyOptionsSchema.safeParse({
    type: query.type,
    cooldownSeconds: query.cooldownSeconds
      ? Number(query.cooldownSeconds)
      : undefined,
  });

  if (!parsed.success) {
    return errorResponse(c, "Invalid query parameters", 400);
  }

  const key = await keyService.getRandomAvailableKey(
    parsed.data.type,
    parsed.data.cooldownSeconds,
  );

  if (!key) {
    return errorResponse(c, "No available keys", 503, "NO_KEYS_AVAILABLE");
  }

  return successResponse(c, {
    keyId: key.keyId,
    encryptedKey: key.encryptedKey,
    type: key.keyType,
  });
}
