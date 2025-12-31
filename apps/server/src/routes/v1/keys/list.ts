import type { Context } from "hono";

import { successResponse } from "~/libs/utils/response";

import { keyService } from "./service";

/**
 * GET /keys - List all keys (without encrypted values)
 * Admin auth required
 */
export async function listKeys(c: Context) {
  const keys = await keyService.listKeys();

  return successResponse(c, keys);
}
