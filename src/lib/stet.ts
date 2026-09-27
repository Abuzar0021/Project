import { newId, readJSON, writeJSON } from "./storage";

export interface StetRule {
  id: string;
  ruleId: string;
  match: string;
  scope: "draft" | "all";
  draftId: string | null;
  createdAt: string;
}

const key = (email: string) => `stet:${email}`;

export const normalize = (text: string) =>
  text.toLowerCase().replace(/\s+/g, " ").trim();

export function listStet(email: string): StetRule[] {
  return readJSON<StetRule[]>(key(email), []);
}

export function addStet(
  email: string,
  input: {
    ruleId: string;
    original: string;
    scope: "draft" | "all";
    draftId: string;
  },
): StetRule {
  const rule: StetRule = {
    id: newId(),
    ruleId: input.ruleId,
    match: normalize(input.original),
    scope: input.scope,
    draftId: input.scope === "draft" ? input.draftId : null,
    createdAt: new Date().toISOString(),
  };
  writeJSON(key(email), [...listStet(email), rule]);
  return rule;
}

export function removeStet(email: string, id: string): void {
  writeJSON(
    key(email),
    listStet(email).filter((rule) => rule.id !== id),
  );
}

export function isKept(
  issue: { ruleId: string; original: string },
  rules: StetRule[],
  draftId: string,
): boolean {
  const match = normalize(issue.original);
  return rules.some(
    (rule) =>
      rule.ruleId === issue.ruleId &&
      rule.match === match &&
      (rule.scope === "all" || rule.draftId === draftId),
  );
}
