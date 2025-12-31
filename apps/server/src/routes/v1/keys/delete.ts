import type { Context } from "hono";

import { errorResponse, successResponse } from "~/libs/utils/response";

import { keyService } from "./service";

/**
 * DELETE /keys/:id - Delete a key
 * Admin auth required
 */
export async function deleteKey(c: Context) {
  const id = c.req.param("id");

  const deleted = await keyService.deleteKey(id);

  if (!deleted) {
    return errorResponse(c, "Key not found", 404);
  }

  return successResponse(c, { success: true });
}
