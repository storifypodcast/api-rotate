import type { Context } from "hono";

import { successResponse } from "~/libs/utils/response";

export function healthCheck(c: Context) {
  return successResponse(c, {
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
