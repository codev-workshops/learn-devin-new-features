// apps/mobile lint: the root config ignores apps/**, so the workspace lints itself with the same
// presets plus React Native globals.
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".expo/**",
      "android/**",
      "ios/**",
      "coverage/**",
      "expo-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2024, ...globals.browser, __DEV__: "readonly" },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
