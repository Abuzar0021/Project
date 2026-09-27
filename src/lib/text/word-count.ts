/** Word counts and reading time. */

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/** Minutes to read at 230 words a minute, never less than one. */
export function readMinutes(words: number): number {
  return Math.max(1, Math.round(words / 230));
}
