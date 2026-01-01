import type { Context } from "hono";

import type { AuthVariables } from "~/libs/middlewares";
import { successResponse } from "~/libs/utils/response";

import { keyService } from "./service";

/**
 * GET /keys/fingerprints - Get fingerprints for all keys
 * Used by frontend to check key consistency
 * Admin auth required
 */
export async function getFingerprints(c: Context<{ Variables: AuthVariables }>) {
  const userId = c.get("userId");
  const fingerprints = await keyService.getKeyFingerprints(userId);

  return successResponse(c, fingerprints);
}
