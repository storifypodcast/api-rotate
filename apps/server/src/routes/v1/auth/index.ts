import type { Context } from "hono";
import { Hono } from "hono";

import { auth } from "~/libs/auth";

export const authRouter = new Hono();

/**
 * Better Auth handler - handles all auth endpoints
 * POST /v1/auth/sign-in/email-otp - Send OTP
 * POST /v1/auth/sign-in/email-otp/verify - Verify OTP
 */
authRouter.all("/*", async (c: Context) => {
  return auth.handler(c.req.raw);
});
