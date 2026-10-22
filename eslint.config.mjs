// Root ESLint config: covers root scripts and packages/*. Each app/service
// workspace ships its own `lint` script (and may extend this file).
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "apps/**",
      "services/**",
      "labs/**",
      "db/**",
      "scenarios/**",
      "fixtures/**",
      "infra/**",
      "observability/**",
      "outpost/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts}"],
    languageOptions: { globals: { ...globals.node, ...globals.es2024 } },
    rules: {
      "no-console": "off",
    },
  },
);
