/**
 * The app frame for every page under /app. The theme cookie is read on the
 * server so the first paint already matches the writer's light or dark choice.
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { THEME_COOKIE, type Theme } from "@/lib/account";
import { AppProvider } from "@/components/app/AppContext";
import { AppShell } from "@/components/app/AppShell";

export const metadata: Metadata = {
  title: "Drafts",
  robots: { index: false },
};

const THEMES: Theme[] = ["system", "dark", "light"];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stored = (await cookies()).get(THEME_COOKIE)?.value as
    | Theme
    | undefined;
  const theme = stored && THEMES.includes(stored) ? stored : "dark";

  return (
    <AppProvider
      initialTheme={theme}
      fallback={
        <div
          className="app"
          data-theme={theme}
          style={{ minHeight: "100dvh" }}
        />
      }
    >
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
