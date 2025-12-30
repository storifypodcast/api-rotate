import { defineConfig } from "eslint/config";

import { baseConfig } from "@api_rotate/eslint-config/base";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
);
