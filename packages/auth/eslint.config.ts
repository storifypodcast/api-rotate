import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@api_rotate/eslint-config/base";

export default defineConfig(
  {
    ignores: ["script/**"],
  },
  baseConfig,
  restrictEnvAccess,
);
