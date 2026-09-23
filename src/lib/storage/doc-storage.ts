/**
 * doc-storage.ts: persist the current draft (document JSON + title) to
 * localStorage so a reload restores the writer's work. Every access is wrapped
 * in try/catch because storage can be unavailable (private mode, quota, SSR).
 * The caller decides when to save; this module only reads and writes.
 */
import type { JSONContent } from "@tiptap/core";

const DRAFT_KEY = "margin-draft";

export interface StoredDraft {
  doc: JSONContent;
  title: string;
}

/** Load the saved draft, or null if there is none or storage is unreadable. */
export function loadDraft(): StoredDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (!parsed || typeof parsed !== "object" || !parsed.doc) return null;
    return {
      doc: parsed.doc,
      title: typeof parsed.title === "string" ? parsed.title : "",
    };
  } catch {
    return null;
  }
}

/** Save the current draft. Failures are swallowed; losing a save is not fatal. */
export function saveDraft(draft: StoredDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Ignore: storage may be full or blocked. The draft stays in memory.
  }
}

/** Remove the saved draft, used by "New draft". */
export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ignore.
  }
}
