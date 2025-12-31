import type { Context } from "hono";

import { successResponse } from "~/libs/utils/response";

import { keyService } from "./service";

/**
 * GET /keys/stats - Get aggregated key statistics
 * Admin auth required
 */
export async function getStats(c: Context) {
  const stats = await keyService.getStats();

  return successResponse(c, stats);
}
