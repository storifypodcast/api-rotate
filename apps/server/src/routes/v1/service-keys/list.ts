import type { Context } from "hono";

import type { AuthVariables } from "~/libs/middlewares";
import { successResponse } from "~/libs/utils/response";

import { serviceKeyService } from "./service";

/**
 * GET /service-keys - List all service keys for the user
 * Session auth required
 */
export async function listServiceKeys(
  c: Context<{ Variables: AuthVariables }>,
) {
  const userId = c.get("userId");
  const keys = await serviceKeyService.listServiceKeys(userId);

  return successResponse(c, keys);
}
