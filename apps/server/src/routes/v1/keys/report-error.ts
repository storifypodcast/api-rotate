import type { Context } from "hono";

import { reportErrorSchema } from "@api_rotate/db";
import { errorResponse, successResponse } from "~/libs/utils/response";

import { keyService } from "./service";

/**
 * POST /keys/report-error - Report key error (triggers exponential backoff)
 * Service auth required
 */
export async function reportError(c: Context) {
  const body: unknown = await c.req.json();

  const parsed = reportErrorSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(c, "Invalid request body", 400);
  }

  const success = await keyService.reportError(
    parsed.data.keyId,
    parsed.data.errorMessage,
  );

  if (!success) {
    return errorResponse(c, "Key not found", 404);
  }

  return successResponse(c, { success: true });
}
