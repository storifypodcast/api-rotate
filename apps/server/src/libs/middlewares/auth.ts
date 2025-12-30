import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

import { auth } from "~/libs/auth";
import { createLogger } from "~/libs/utils/logger";

const log = createLogger("AuthMiddleware");

export interface AuthVariables {
  userId: string;
  sessionId: string;
}

/**
 * Better Auth middleware
 * Validates session token and sets userId in context
 */
export async function authMiddleware(
  c: Context<{ Variables: AuthVariables }>,
  next: Next,
) {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      log.warn("No valid session found");
      throw new HTTPException(401, {
        message: "Unauthorized - No valid session",
      });
    }

    if (!session.user.id || !session.session.id) {
      log.warn("No valid session found");
      throw new HTTPException(401, {
        message: "Unauthorized - No valid session",
      });
    }

    // Set user and session in context
    c.set("userId", session.user.id);
    c.set("sessionId", session.session.id);

    log.debug({ userId: session.user.id }, "User authenticated");

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    log.error({ error }, "Error validating session");
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }
}
