/** Sentences past this length turn amber in the gutter. */
export const LONG_RHYTHM_WORDS = 30;

/** Words at which a bar reaches the full gutter width. */
const FULL_BAR_WORDS = 42;
const MIN_BAR = 4;

export function barWidth(words: number, gutter: number): number {
  return Math.max(MIN_BAR, Math.min(gutter, (words * gutter) / FULL_BAR_WORDS));
}

export function barLabel(words: number): string {
  const count = `${words} ${words === 1 ? "word" : "words"}`;
  return words > LONG_RHYTHM_WORDS ? `${count}, consider splitting` : count;
}
