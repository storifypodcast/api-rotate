import type { Context } from "hono";

import { insertApiKeySchema } from "@api_rotate/db";
import type { AuthVariables } from "~/libs/middlewares";
import { errorResponse, successResponse } from "~/libs/utils/response";

import { keyService } from "./service";

/**
 * POST /keys - Create a new key
 * Admin auth required
 */
export async function createKey(c: Context<{ Variables: AuthVariables }>) {
  const userId = c.get("userId");
  const body: unknown = await c.req.json();

  const parsed = insertApiKeySchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, "Invalid request body", 400);
  }

  const newKey = await keyService.createKey(userId, parsed.data);

  // Return without encrypted key for security
  return successResponse(
    c,
    {
      id: newKey.id,
      name: newKey.name,
      type: newKey.type,
      defaultCooldown: newKey.defaultCooldown,
      isActive: newKey.isActive,
      createdAt: newKey.createdAt,
    },
    201,
  );
}
