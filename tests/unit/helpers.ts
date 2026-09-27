/** Unwrap a value the test expects to exist, failing clearly when it does not. */
export function must<T>(value: T | null | undefined, what = "value"): T {
  if (value === null || value === undefined)
    throw new Error(`Expected a ${what}`);
  return value;
}

/** The text an issue underlines. */
export function underlined(
  text: string,
  issue: { offset: number; length: number } | undefined,
): string {
  const { offset, length } = must(issue, "issue");
  return text.slice(offset, offset + length);
}
