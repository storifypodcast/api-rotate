import type { Context } from "hono";

import { db, encryptionKeyInfo, eq } from "@api_rotate/db";

import type { AuthVariables } from "~/libs/middlewares";
import { successResponse } from "~/libs/utils/response";

/**
 * GET /encryption-key/info
 * Returns the user's encryption key info for validation
 * Auth: Better Auth session required
 */
export async function getInfo(c: Context<{ Variables: AuthVariables }>) {
  const userId = c.get("userId");

  const info = await db.query.encryptionKeyInfo.findFirst({
    where: eq(encryptionKeyInfo.userId, userId),
    columns: {
      keyFingerprint: true,
      validationToken: true,
    },
  });

  if (!info) {
    return successResponse(c, { exists: false });
  }

  return successResponse(c, {
    exists: true,
    keyFingerprint: info.keyFingerprint,
    validationToken: info.validationToken,
  });
}
