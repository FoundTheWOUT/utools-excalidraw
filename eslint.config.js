import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import * as reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";

export default defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  reactHooks.configs["recommended-latest"],
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      "import/order": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "import/no-duplicates": "error",
      "import/no-unresolved": ["error", { ignore: ["@excalidraw/excalidraw/index.css", "vitest"] }],
    },
  },
  { ignores: ["dist/preload.js"] },
]);
