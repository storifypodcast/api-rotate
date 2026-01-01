import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export function emailEnv() {
  return createEnv({
    server: {
      RESEND_API_KEY: z.string().min(1).optional(),
      EMAIL_FROM: z.string().email().optional(),
    },
    runtimeEnv: {
      // Treat empty strings as undefined (for Docker empty defaults)
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- need || for empty string handling
      RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- need || for empty string handling
      EMAIL_FROM: process.env.EMAIL_FROM || undefined,
    },
    skipValidation:
      !!process.env.CI ||
      !!process.env.SKIP_ENV_VALIDATION ||
      process.env.npm_lifecycle_event === "lint",
  });
}
