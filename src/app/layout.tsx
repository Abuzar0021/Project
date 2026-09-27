/** Root layout: fonts, global styles and the metadata every page inherits. */

import type { Metadata, Viewport } from "next";
import { inter, interTight, jetbrainsMono } from "@/lib/fonts";
import "@/styles/globals.css";

const description =
  "Margin checks spelling, clarity and tone, then leaves short notes beside your text. It learns how you write, so its edits sound like you.";

/**
 * Absolute base for link previews. An explicit NEXT_PUBLIC_SITE_URL wins; on
 * Vercel the production domain is known at build time; locally it is port 3000.
 */
function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Margin", template: "%s | Margin" },
  description,
  openGraph: { title: "Margin", description, type: "website" },
  twitter: { card: "summary_large_image", title: "Margin", description },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
