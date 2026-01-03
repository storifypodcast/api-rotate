import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
// Skip during Docker builds where env vars are only available at runtime
if (!process.env.SKIP_ENV_VALIDATION) {
  await jiti.import("./src/env");
}

/** @type {import("next").NextConfig} */
const config = {
  /** Standalone output for optimized Docker builds */
  output: "standalone",

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@api_rotate/api",
    "@api_rotate/auth",
    "@api_rotate/db",
    "@api_rotate/ui",
    "@api_rotate/validators",
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },

  /** Allow cross-origin requests from local development (e.g., Expo app) */
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default config;
