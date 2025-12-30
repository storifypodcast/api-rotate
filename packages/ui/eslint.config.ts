import { baseConfig } from "@api_rotate/eslint-config/base";
import { reactConfig } from "@api_rotate/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
  reactConfig,
);
