import type { Context } from "hono";

import type { AuthVariables } from "~/libs/middlewares";
import { successResponse } from "~/libs/utils/response";

import { keyService } from "./service";

/**
 * GET /keys - List all keys (without encrypted values)
 * Admin auth required
 */
export async function listKeys(c: Context<{ Variables: AuthVariables }>) {
  const userId = c.get("userId");
  const keys = await keyService.listKeys(userId);

  return successResponse(c, keys);
}
