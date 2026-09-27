"use client";

/**
 * App-wide state for signed-in pages: the account, its drafts, the theme, the
 * command bar, and the plan's entitlements. Redirects to log in when there is
 * no account on this device.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  currentAccount,
  logOut,
  updateAccount,
  type Account,
  type Theme,
} from "@/lib/account";
import { createDraft, listDrafts, seedDrafts, type Draft } from "@/lib/drafts";
import { entitlementsFor, type Entitlements } from "@/lib/entitlements";

export interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  run: () => void;
}

interface AppState {
  account: Account;
  entitlements: Entitlements;
  drafts: Draft[];
  theme: Theme;
  commandOpen: boolean;
  draftCommands: Command[];
  refreshDrafts: () => void;
  saveAccount: (patch: Partial<Omit<Account, "email">>) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: () => boolean;
  setCommandOpen: (open: boolean) => void;
  setDraftCommands: (commands: Command[]) => void;
  newDraft: () => void;
  logout: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}

export function AppProvider({
  initialTheme,
  children,
  fallback,
}: {
  initialTheme: Theme;
  children: ReactNode;
  fallback: ReactNode;
}) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [commandOpen, setCommandOpen] = useState(false);
  const [draftCommands, setDraftCommands] = useState<Command[]>([]);

  useEffect(() => {
    const found = currentAccount();
    if (!found) {
      logOut();
      router.replace("/login");
      return;
    }
    seedDrafts(found.email);
    setAccount(found);
    setThemeState(found.theme);
    setDrafts(listDrafts(found.email));
  }, [router]);

  const refreshDrafts = useCallback(() => {
    if (account) setDrafts(listDrafts(account.email));
  }, [account]);

  const saveAccount = useCallback((patch: Partial<Omit<Account, "email">>) => {
    const next = updateAccount(patch);
    if (next) setAccount(next);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      saveAccount({ theme: next });
    },
    [saveAccount],
  );

  const isDark = useCallback(
    () =>
      theme === "dark" ||
      (theme === "system" &&
        !window.matchMedia("(prefers-color-scheme: light)").matches),
    [theme],
  );

  const toggleTheme = useCallback(
    () => setTheme(isDark() ? "light" : "dark"),
    [isDark, setTheme],
  );

  const entitlements = useMemo(
    () => entitlementsFor(account?.plan ?? "free"),
    [account?.plan],
  );

  const newDraft = useCallback(() => {
    if (!account) return;
    const draft = createDraft(account.email, entitlements.draftLimit);
    if (!draft) {
      router.push("/app/drafts?full=1");
      return;
    }
    setDrafts(listDrafts(account.email));
    router.push(`/app/d/${draft.id}`);
  }, [account, entitlements.draftLimit, router]);

  const logout = useCallback(() => {
    logOut();
    router.push("/");
  }, [router]);

  const value = useMemo<AppState | null>(
    () =>
      account && {
        account,
        entitlements,
        drafts,
        theme,
        commandOpen,
        draftCommands,
        refreshDrafts,
        saveAccount,
        setTheme,
        toggleTheme,
        isDark,
        setCommandOpen,
        setDraftCommands,
        newDraft,
        logout,
      },
    [
      account,
      entitlements,
      drafts,
      theme,
      commandOpen,
      draftCommands,
      refreshDrafts,
      saveAccount,
      setTheme,
      toggleTheme,
      isDark,
      newDraft,
      logout,
    ],
  );

  if (!value) return <>{fallback}</>;
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
