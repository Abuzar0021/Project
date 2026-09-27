"use client";

/**
 * The app frame: sidebar, main column and command bar. Owns the Ctrl or Cmd K
 * shortcut and the global commands; draft pages add their own through context.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { initials, workspaceName } from "@/lib/account";
import { tagCounts } from "@/lib/drafts";
import { useApp, type Command } from "./AppContext";
import { Sidebar } from "./Sidebar";
import { CommandMenu } from "./CommandMenu";
import styles from "./AppShell.module.css";

const ShellContext = createContext<{ openSidebar: () => void }>({
  openSidebar: () => undefined,
});

export const useShell = () => useContext(ShellContext);

export function AppShell({ children }: { children: ReactNode }) {
  const app = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(false);
  const {
    account,
    drafts,
    theme,
    toggleTheme,
    isDark,
    setCommandOpen,
    commandOpen,
    draftCommands,
  } = app;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setCommandOpen]);

  const commands = useMemo<Command[]>(() => {
    return [
      ...draftCommands,
      {
        id: "theme",
        group: "View",
        label: `Switch to ${isDark() ? "light" : "dark"}`,
        run: toggleTheme,
      },
      ...["a customer", "a manager", "a non-native speaker"].map((who) => ({
        id: `read-${who}`,
        group: "View",
        label: `Read as ${who}`,
        hint: "Coming soon",
        disabled: true,
        run: () => undefined,
      })),
      { id: "new", group: "Go to", label: "New draft", run: app.newDraft },
      {
        id: "all",
        group: "Go to",
        label: "All drafts",
        run: () => router.push("/app/drafts"),
      },
      ...drafts.map((draft) => ({
        id: `open-${draft.id}`,
        group: "Go to",
        label: draft.title || "Untitled",
        run: () => router.push(`/app/d/${draft.id}`),
      })),
      {
        id: "settings",
        group: "Account",
        label: "Settings",
        run: () => router.push("/app/settings"),
      },
      {
        id: "pricing",
        group: "Account",
        label: "Pricing",
        run: () => router.push("/pricing"),
      },
      { id: "logout", group: "Account", label: "Log out", run: app.logout },
    ];
  }, [
    draftCommands,
    isDark,
    toggleTheme,
    app.newDraft,
    app.logout,
    drafts,
    router,
  ]);

  const currentId = pathname.startsWith("/app/d/")
    ? pathname.split("/")[3]
    : null;
  const close = () => setSideOpen(false);
  const shell = useMemo(() => ({ openSidebar: () => setSideOpen(true) }), []);

  return (
    <ShellContext.Provider value={shell}>
      <div className={`app ${styles.shell}`} data-theme={theme}>
        <div className={`${styles.side} ${sideOpen ? styles.sideOpen : ""}`}>
          <Sidebar
            workspace={workspaceName(account.email)}
            userName={account.name}
            initials={initials(account.name)}
            primary={[
              {
                key: "all",
                label: "All drafts",
                count: String(drafts.length),
                href: "/app/drafts",
                current: pathname === "/app/drafts",
              },
            ]}
            recent={drafts.slice(0, 8).map((draft) => ({
              key: draft.id,
              label: draft.title || "Untitled",
              count: draft.words.toLocaleString("en-US"),
              href: `/app/d/${draft.id}`,
              current: draft.id === currentId,
            }))}
            tags={tagCounts(drafts).map(({ tag, count }) => ({
              key: tag,
              label: `# ${tag}`,
              count: String(count),
              href: `/app/drafts?tag=${encodeURIComponent(tag)}`,
            }))}
            settingsHref="/app/settings"
            onSearch={() => setCommandOpen(true)}
            onNewDraft={app.newDraft}
            onLogout={app.logout}
            onNavigate={close}
          />
        </div>
        {sideOpen ? (
          <button
            type="button"
            className={styles.scrim}
            onClick={close}
            aria-label="Close sidebar"
          />
        ) : null}
        <main className={styles.main}>{children}</main>
        <CommandMenu
          open={commandOpen}
          onOpenChange={setCommandOpen}
          commands={commands}
        />
      </div>
    </ShellContext.Provider>
  );
}
