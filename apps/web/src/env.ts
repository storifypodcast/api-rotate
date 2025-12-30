import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { authEnv } from "@api_rotate/auth/env";
import { dbEnv } from "@api_rotate/db/env";

export const env = createEnv({
  extends: [authEnv(), dbEnv()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  server: {
    BETTER_AUTH_URL: z.string().url().optional(),
  },
  client: {},
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation:
    !!process.env.CI ||
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint",
});
