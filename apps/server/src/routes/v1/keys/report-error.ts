import type { Context } from "hono";

import { reportErrorSchema } from "@api_rotate/db";
import type { ServiceAuthVariables } from "~/libs/middlewares";
import { errorResponse, successResponse } from "~/libs/utils/response";

import { keyService } from "./service";

/**
 * POST /keys/report-error - Report key error (triggers exponential backoff)
 * Service auth required
 */
export async function reportError(
  c: Context<{ Variables: ServiceAuthVariables }>,
) {
  const userId = c.get("userId");
  const body: unknown = await c.req.json();

  const parsed = reportErrorSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, "Invalid request body", 400);
  }

  const success = await keyService.reportError(
    userId,
    parsed.data.keyId,
    parsed.data.errorMessage,
  );

  if (!success) {
    return errorResponse(c, "Key not found", 404);
  }

  return successResponse(c, { success: true });
}
