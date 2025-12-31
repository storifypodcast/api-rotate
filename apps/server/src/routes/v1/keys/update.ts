import type { Context } from "hono";

import { updateApiKeySchema } from "@api_rotate/db";
import { errorResponse, successResponse } from "~/libs/utils/response";

import { keyService } from "./service";

/**
 * PATCH /keys/:id - Update an existing key
 * Admin auth required
 */
export async function updateKey(c: Context) {
  const id = c.req.param("id");
  const body: unknown = await c.req.json();

  const parsed = updateApiKeySchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, "Invalid request body", 400);
  }

  const updated = await keyService.updateKey(id, parsed.data);

  if (!updated) {
    return errorResponse(c, "Key not found", 404);
  }

  return successResponse(c, updated);
}
