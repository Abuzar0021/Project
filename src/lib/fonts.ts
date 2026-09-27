/** The three typefaces, self-hosted through next/font. */

import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

export const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-inter-tight",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});
