import type { Metadata, Viewport } from "next";
import { inter, interTight, jetbrainsMono } from "@/lib/fonts";
import "@/styles/globals.css";

const description =
  "Margin checks spelling, clarity and tone, then leaves short notes beside your text. It learns how you write, so its edits sound like you.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
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
