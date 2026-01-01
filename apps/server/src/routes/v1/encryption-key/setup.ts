import type { Context } from "hono";
import { z } from "zod";

import { db, encryptionKeyInfo, eq } from "@api_rotate/db";

import type { AuthVariables } from "~/libs/middlewares";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "~/libs/utils/response";

const setupSchema = z.object({
  keyFingerprint: z.string().length(64, "Fingerprint must be 64 hex characters"),
  validationToken: z.string().min(1, "Validation token is required"),
});

/**
 * POST /encryption-key/setup
 * Creates encryption key info for the user
 * Only allowed if no encryption key info exists
 * Auth: Better Auth session required
 */
export async function setup(c: Context<{ Variables: AuthVariables }>) {
  const userId = c.get("userId");

  // Parse and validate request body
  const body: unknown = await c.req.json();
  const parsed = setupSchema.safeParse(body);

  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      errors[path] ??= [];
      errors[path].push(issue.message);
    }
    return validationErrorResponse(c, errors);
  }

  // Check if already exists
  const existing = await db.query.encryptionKeyInfo.findFirst({
    where: eq(encryptionKeyInfo.userId, userId),
  });

  if (existing) {
    return errorResponse(c, "Encryption key already configured", 409, "ALREADY_CONFIGURED");
  }

  // Create new encryption key info
  await db.insert(encryptionKeyInfo).values({
    userId,
    keyFingerprint: parsed.data.keyFingerprint,
    validationToken: parsed.data.validationToken,
  });

  return successResponse(c, { success: true }, 201);
}
