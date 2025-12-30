import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@api_rotate/eslint-config/base";
import { nextjsConfig } from "@api_rotate/eslint-config/nextjs";
import { reactConfig } from "@api_rotate/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
