/**
 * prefs.ts: persist the writer's checking preferences to localStorage.
 * Two things survive reloads: the rules the writer has chosen to ignore, and the
 * words they have added to their dictionary. Dismissed single instances are not
 * persisted (they are a session convenience), so they live only in the store.
 * Every access is wrapped in try/catch because storage can be unavailable.
 */
const IGNORED_RULES_KEY = "margin-ignored-rules";
const DICTIONARY_KEY = "margin-dictionary";

function loadList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function saveList(key: string, values: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Ignore: losing a preference save is not fatal.
  }
}

export function loadIgnoredRules(): string[] {
  return loadList(IGNORED_RULES_KEY);
}

export function saveIgnoredRules(rules: string[]): void {
  saveList(IGNORED_RULES_KEY, rules);
}

export function loadDictionary(): string[] {
  return loadList(DICTIONARY_KEY);
}

export function saveDictionary(words: string[]): void {
  saveList(DICTIONARY_KEY, words);
}
