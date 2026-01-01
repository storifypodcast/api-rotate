import type { Context } from "hono";

import { createServiceKeySchema } from "@api_rotate/db";
import type { AuthVariables } from "~/libs/middlewares";
import { errorResponse, successResponse } from "~/libs/utils/response";

import { serviceKeyService } from "./service";

/**
 * POST /service-keys - Generate a new service key
 * Session auth required
 */
export async function createServiceKey(
  c: Context<{ Variables: AuthVariables }>,
) {
  const userId = c.get("userId");
  const body: unknown = await c.req.json();

  const parsed = createServiceKeySchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, "Invalid request body", 400);
  }

  try {
    const result = await serviceKeyService.createServiceKey(
      userId,
      parsed.data.name,
    );

    // IMPORTANT: The full key is only returned at creation
    return successResponse(
      c,
      {
        id: result.id,
        name: result.name,
        key: result.key, // Only shown once!
        prefix: result.prefix,
        createdAt: result.createdAt,
      },
      201,
    );
  } catch (error) {
    // Check for unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes("duplicate key value")
    ) {
      return errorResponse(
        c,
        "A service key with this name already exists",
        409,
      );
    }
    throw error;
  }
}
