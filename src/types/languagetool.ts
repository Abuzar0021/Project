/**
 * languagetool.ts: trimmed types for the LanguageTool response.
 * We never expose LanguageTool's full payload to the client; the /api/check
 * route narrows each match to just these fields. Keeping the shape small makes
 * the wire format cheap and the client code easy to reason about.
 */

/** One match as returned by our /api/check route (already trimmed). */
export interface RawMatch {
  /** UTF-16 code-unit offset into the block text. */
  offset: number;
  /** Length in UTF-16 code units. */
  length: number;
  /** Full explanation from LanguageTool. */
  message: string;
  /** Optional shorter message, when LanguageTool provides one. */
  shortMessage?: string;
  /** Suggested replacements, already reduced to plain strings. */
  replacements: string[];
  rule: {
    id: string;
    category: { id: string; name?: string };
    issueType?: string;
  };
}

/** The body our /api/check route returns on success. */
export interface CheckResponse {
  matches: RawMatch[];
}

/** The body our /api/check route returns on failure. */
export interface CheckErrorResponse {
  error: string;
}
