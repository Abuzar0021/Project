/** Small per-writer preferences, such as whether the rhythm gutter is on. */

import { readJSON, writeJSON } from "./storage";

export interface Prefs {
  rhythm: boolean;
}

const DEFAULTS: Prefs = { rhythm: true };

export function getPrefs(email: string): Prefs {
  return { ...DEFAULTS, ...readJSON<Partial<Prefs>>(`prefs:${email}`, {}) };
}

export function setPrefs(email: string, patch: Partial<Prefs>): Prefs {
  const next = { ...getPrefs(email), ...patch };
  writeJSON(`prefs:${email}`, next);
  return next;
}
