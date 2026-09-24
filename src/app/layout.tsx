/**
 * Root layout for Margin.
 * Wires the two fonts onto <html> as CSS variables, loads global styles, and
 * applies the saved theme before first paint so there is no light/dark flash.
 */
import type { Metadata, Viewport } from "next";
import { newsreader, instrumentSans } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Margin",
  description:
    "A writing editor where suggestions live in the margin, pinned to the line they refer to.",
};

export const viewport: Viewport = {
  // Browser-chrome color. This is HTML metadata, not styling, and cannot read a
  // CSS variable, so these two values mirror --paper (light and dark) by hand.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#16181b" },
  ],
};

// Runs before paint: promote a stored theme choice to <html data-theme> so the
// first render matches the user's last pick instead of flashing the OS default.
const themeInitScript = `
try {
  var t = localStorage.getItem("margin-theme");
  if (t === "light" || t === "dark") {
    document.documentElement.setAttribute("data-theme", t);
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${instrumentSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
