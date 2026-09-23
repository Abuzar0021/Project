/**
 * Next.js configuration for Margin.
 * Kept intentionally small: the app is a single-page editor, so we only set
 * defaults that every phase relies on. Production packaging (standalone output,
 * Docker) is layered in during a later phase.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
