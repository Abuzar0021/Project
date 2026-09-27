/**
 * Accounts for this preview, stored in the browser. A session cookie lets the
 * middleware guard the app, and a theme cookie lets the server render the
 * right theme first time. This module is the seam for a real auth service.
 */

import type { Period, PlanId } from "./plans";
import { TRIAL_DAYS } from "./plans";
import {
  clearCookie,
  readJSON,
  removeKey,
  setCookie,
  writeJSON,
} from "./storage";

export type Theme = "system" | "dark" | "light";

export interface Account {
  name: string;
  email: string;
  plan: PlanId;
  period: Period;
  trialEndsAt: string | null;
  theme: Theme;
  onboarded: boolean;
  createdAt: string;
}

export const SESSION_COOKIE = "margin_session";
export const THEME_COOKIE = "margin_theme";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function emailError(email: string): string | null {
  if (!email.trim()) return "Enter your email address.";
  if (!EMAIL.test(email.trim()))
    return "Enter an email address like name@company.com";
  return null;
}

const accounts = () => readJSON<Record<string, Account>>("accounts", {});

function startSession(account: Account) {
  writeJSON("session", account.email);
  setCookie(SESSION_COOKIE, "1");
  setCookie(THEME_COOKIE, account.theme);
}

export function findAccount(email: string): Account | null {
  return accounts()[normalizeEmail(email)] ?? null;
}

export function signUp(input: {
  name: string;
  email: string;
  plan?: PlanId;
  period?: Period;
}): Account {
  const email = normalizeEmail(input.email);
  const plan = input.plan ?? "pro";
  const trialEnds = new Date(
    Date.now() + TRIAL_DAYS * 86_400_000,
  ).toISOString();
  const account: Account = {
    name: input.name.trim(),
    email,
    plan,
    period: input.period ?? "yearly",
    trialEndsAt: plan === "free" ? null : trialEnds,
    theme: "dark",
    onboarded: false,
    createdAt: new Date().toISOString(),
  };
  writeJSON("accounts", { ...accounts(), [email]: account });
  startSession(account);
  return account;
}

export function logIn(email: string): Account | null {
  const account = findAccount(email);
  if (account) startSession(account);
  return account;
}

export function logOut(): void {
  removeKey("session");
  clearCookie(SESSION_COOKIE);
}

export function currentAccount(): Account | null {
  const email = readJSON<string | null>("session", null);
  return email ? findAccount(email) : null;
}

export function updateAccount(
  patch: Partial<Omit<Account, "email">>,
): Account | null {
  const account = currentAccount();
  if (!account) return null;
  const next = { ...account, ...patch };
  writeJSON("accounts", { ...accounts(), [account.email]: next });
  if (patch.theme) setCookie(THEME_COOKIE, patch.theme);
  return next;
}

/** Remove the account and everything stored for it on this device. */
export function deleteAccount(): void {
  const account = currentAccount();
  if (!account) return;
  const rest = Object.fromEntries(
    Object.entries(accounts()).filter(([email]) => email !== account.email),
  );
  writeJSON("accounts", rest);
  for (const key of ["drafts", "stet", "voice", "prefs"])
    removeKey(`${key}:${account.email}`);
  logOut();
}

const PERSONAL_DOMAINS = new Set([
  "gmail",
  "googlemail",
  "outlook",
  "hotmail",
  "live",
  "yahoo",
  "icloud",
  "me",
  "proton",
  "protonmail",
  "aol",
  "example",
]);

/** "mira@northwind.co" belongs to Northwind; a Gmail address is Personal. */
export function workspaceName(email: string): string {
  const domain = email.split("@")[1]?.split(".")[0] ?? "";
  if (!domain || PERSONAL_DOMAINS.has(domain)) return "Personal";
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return (
    letters.map((part) => part?.charAt(0).toUpperCase() ?? "").join("") || "M"
  );
}
