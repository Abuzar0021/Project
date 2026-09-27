/**
 * Next.js configuration for Margin.
 * Kept intentionally small: the app is a single-page editor, so we only set
 * defaults that every phase relies on. Production packaging (standalone output,
 * Docker) is layered in during a later phase.
 */
import type { NextConfig } from "next";

// Standalone output bundles a minimal server for the production Docker image.
// Skip it where it is not wanted: Vercel provides its own build output (VERCEL
// is set during Vercel builds), and on Windows the standalone step copies
// pnpm's symlinked packages, which fails with EPERM unless Developer Mode is on.
// The Docker image builds on Linux, so it always gets standalone output.
const skipStandalone =
  Boolean(process.env.VERCEL) || process.platform === "win32";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(skipStandalone ? {} : { output: "standalone" as const }),
};

export default nextConfig;
