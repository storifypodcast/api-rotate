import type { Context } from "hono";

import type { AuthVariables } from "~/libs/middlewares";
import { errorResponse, successResponse } from "~/libs/utils/response";

import { serviceKeyService } from "./service";

/**
 * DELETE /service-keys/:id - Revoke a service key
 * Session auth required
 */
export async function revokeServiceKey(
  c: Context<{ Variables: AuthVariables }>,
) {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const revoked = await serviceKeyService.revokeServiceKey(userId, id);

  if (!revoked) {
    return errorResponse(c, "Service key not found", 404);
  }

  return successResponse(c, { success: true });
}
