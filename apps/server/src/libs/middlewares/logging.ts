import type { Context, Next } from "hono";

import { createLogger } from "~/libs/utils/logger";

const log = createLogger("HTTP");

/**
 * Logging middleware
 * Logs all incoming requests and responses
 */
export async function loggingMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const { method, path } = c.req;

  log.info({ method, path }, "Incoming request");

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  log.info(
    {
      method,
      path,
      status,
      duration: `${duration}ms`,
    },
    "Request completed",
  );
}
