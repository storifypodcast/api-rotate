import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

import { env } from "~/env";
import { createLogger } from "~/libs/utils/logger";

const log = createLogger("ServiceAuthMiddleware");

/**
 * Service API Key authentication middleware
 * Validates Bearer token against SERVICE_API_KEY for programmatic access
 */
export async function serviceAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    log.warn("No Authorization header");
    throw new HTTPException(401, {
      message: "Unauthorized - Missing Authorization header",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    log.warn("Invalid Authorization header format");
    throw new HTTPException(401, {
      message: "Unauthorized - Invalid Authorization header format",
    });
  }

  const token = authHeader.slice(7);

  if (token !== env.SERVICE_API_KEY) {
    log.warn("Invalid service API key");
    throw new HTTPException(401, {
      message: "Unauthorized - Invalid API key",
    });
  }

  log.debug("Service authenticated");
  await next();
}
