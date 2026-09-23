/**
 * word-count.ts: count words in a plain-text string.
 * Pure and framework free so it can be reused by the score panel and unit
 * tested. A "word" is a run of non-whitespace, which matches how writers count
 * and keeps punctuation from inflating the total.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}
