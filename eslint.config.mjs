/**
 * Flat ESLint config for Margin.
 * Combines Next.js core-web-vitals rules with typescript-eslint's strict and
 * stylistic presets (type-aware, scoped to .ts/.tsx) and Prettier's conflict-off
 * config. The rule set is deliberately tight: the brief forbids `any` and any
 * disabled rule without an explanatory comment.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  {
    // Type-aware linting only makes sense for our TypeScript sources.
    files: ["**/*.ts", "**/*.tsx"],
    extends: [...tseslint.configs.strict, ...tseslint.configs.stylistic],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // The brief bans `any`; make it an error rather than the default warn.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
    },
  },
  prettier,
);
