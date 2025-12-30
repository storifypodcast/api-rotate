import { initAuth } from "@api_rotate/auth";

import { env } from "~/env";

/**
 * Server-side Better Auth instance
 */
export const auth = initAuth({
  baseUrl: env.BETTER_AUTH_URL ?? `http://localhost:${env.PORT}`,
  productionUrl: env.BETTER_AUTH_URL ?? `http://localhost:${env.PORT}`,
  secret: env.BETTER_AUTH_SECRET,
  basePath: "/v1/auth",
});
