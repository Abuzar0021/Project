/**
 * Next.js configuration for Margin.
 * Kept intentionally small: the app is a single-page editor, so we only set
 * defaults that every phase relies on. Production packaging (standalone output,
 * Docker) is layered in during a later phase.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output bundles a minimal server for the production Docker image.
  // Vercel provides its own build output, so we skip it there (VERCEL is set
  // during Vercel builds) and keep it for Docker and local production runs.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
};

export default nextConfig;
