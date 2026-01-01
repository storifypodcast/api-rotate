import type { Context } from "hono";

import type { AuthVariables } from "~/libs/middlewares";
import { successResponse } from "~/libs/utils/response";

import { keyService } from "./service";

/**
 * GET /keys/stats - Get aggregated key statistics
 * Admin auth required
 */
export async function getStats(c: Context<{ Variables: AuthVariables }>) {
  const userId = c.get("userId");
  const stats = await keyService.getStats(userId);

  return successResponse(c, stats);
}
