/**
 * Vitest config for unit tests.
 * Pure logic under src/lib is the main target, but jsdom is enabled so we can
 * also test React-free DOM helpers later. The @ alias mirrors tsconfig.
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      // The brief requires 85%+ coverage for src/lib.
      thresholds: {
        statements: 85,
        lines: 85,
        functions: 85,
        branches: 75,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
