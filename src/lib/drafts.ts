import type { JSONContent } from "@tiptap/core";
import { countWords } from "./text/word-count";
import { newId, readJSON, writeJSON } from "./storage";
import { SEED_DRAFTS } from "./seed-drafts";

export interface Draft {
  id: string;
  title: string;
  content: JSONContent;
  words: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const key = (email: string) => `drafts:${email}`;

export function paragraphsToDoc(paragraphs: string[]): JSONContent {
  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: text ? [{ type: "text", text }] : [],
    })),
  };
}

/** Plain text of a document, one paragraph per line. */
export function docText(content: JSONContent): string {
  const blocks: string[] = [];
  const inline = (node: JSONContent): string => {
    if (node.type === "text") return node.text ?? "";
    if (node.type === "hardBreak") return "\n";
    return (node.content ?? []).map(inline).join("");
  };
  const visit = (node: JSONContent) => {
    if (node.type === "paragraph" || node.type === "heading")
      blocks.push(inline(node));
    else (node.content ?? []).forEach(visit);
  };
  visit(content);
  return blocks.join("\n");
}

function all(email: string): Draft[] {
  return readJSON<Draft[]>(key(email), []);
}

function save(email: string, drafts: Draft[]) {
  writeJSON(key(email), drafts);
}

export function listDrafts(email: string): Draft[] {
  return [...all(email)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDraft(email: string, id: string): Draft | null {
  return all(email).find((draft) => draft.id === id) ?? null;
}

export function createDraft(email: string, limit: number | null): Draft | null {
  const drafts = all(email);
  if (limit !== null && drafts.length >= limit) return null;
  const now = new Date().toISOString();
  const draft: Draft = {
    id: newId(),
    title: "",
    content: paragraphsToDoc([""]),
    words: 0,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  save(email, [...drafts, draft]);
  return draft;
}

export function saveDraft(
  email: string,
  id: string,
  patch: Partial<Pick<Draft, "title" | "content" | "tags">>,
): Draft | null {
  let saved: Draft | null = null;
  const drafts = all(email).map((draft) => {
    if (draft.id !== id) return draft;
    const content = patch.content ?? draft.content;
    saved = {
      ...draft,
      ...patch,
      words: countWords(docText(content)),
      updatedAt: new Date().toISOString(),
    };
    return saved;
  });
  save(email, drafts);
  return saved;
}

export function deleteDraft(email: string, id: string): void {
  save(
    email,
    all(email).filter((draft) => draft.id !== id),
  );
}

/** Give a new account the sample drafts once, so the app is never empty. */
export function seedDrafts(email: string): void {
  if (readJSON<boolean>(`seeded:${email}`, false)) return;
  const now = Date.now();
  const seeded = SEED_DRAFTS.map((seed): Draft => {
    const content = paragraphsToDoc(seed.paragraphs);
    const at = new Date(now - seed.minutesAgo * 60_000).toISOString();
    return {
      id: newId(),
      title: seed.title,
      content,
      words: countWords(docText(content)),
      tags: seed.tags,
      createdAt: at,
      updatedAt: at,
    };
  });
  save(email, [...all(email), ...seeded]);
  writeJSON(`seeded:${email}`, true);
}

export function tagCounts(drafts: Draft[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const draft of drafts) {
    for (const tag of draft.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function editedAgo(iso: string, now = Date.now()): string {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "Edited just now";
  if (minutes < 60) return `Edited ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24)
    return `Edited ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  return `Edited ${days} ${days === 1 ? "day" : "days"} ago`;
}
