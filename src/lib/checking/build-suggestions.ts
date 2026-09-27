import type { DetectedIssue, Suggestion } from "@/types/suggestion";
import type { RawMatch } from "@/types/languagetool";
import { categoryFor, labelFor, shortenReason } from "@/lib/categories";

const MAX_REPLACEMENTS = 3;

export function matchToIssue(match: RawMatch): DetectedIssue {
  return {
    offset: match.offset,
    length: match.length,
    ruleId: match.rule.id,
    category: categoryFor(match),
    label: labelFor(match),
    reason: shortenReason(match.message || match.shortMessage || ""),
    replacements: match.replacements.slice(0, MAX_REPLACEMENTS),
    source: "languagetool",
  };
}

/** Lower wins when two issues underline overlapping text. */
function priority(issue: DetectedIssue): number {
  if (issue.category === "spelling")
    return issue.source === "languagetool" ? 0 : 1;
  if (issue.category === "voice") return 2;
  if (
    issue.ruleId === "local:wordy" ||
    issue.ruleId.startsWith("local:plainer")
  )
    return 3;
  if (issue.source === "languagetool") return 4;
  if (issue.ruleId === "local:passive") return 6;
  if (issue.ruleId === "local:long-sentence") return 7;
  return 5;
}

/** Keep one issue per stretch of text, preferring the more important one. */
export function dropOverlaps(issues: DetectedIssue[]): DetectedIssue[] {
  const kept: DetectedIssue[] = [];
  const ranked = [...issues].sort(
    (a, b) => priority(a) - priority(b) || a.offset - b.offset,
  );
  for (const issue of ranked) {
    const end = issue.offset + issue.length;
    const clash = kept.some(
      (k) => issue.offset < k.offset + k.length && end > k.offset,
    );
    if (!clash) kept.push(issue);
  }
  return kept.sort((a, b) => a.offset - b.offset);
}

function toDoc(
  posMap: number[],
  offset: number,
  length: number,
): { from: number; to: number } | null {
  if (length <= 0 || offset < 0 || offset >= posMap.length) return null;
  const from = posMap[offset];
  const last = posMap[Math.min(offset + length - 1, posMap.length - 1)];
  if (from === undefined || last === undefined) return null;
  return { from, to: last + 1 };
}

export function buildSuggestions(
  blockId: string,
  blockHash: string,
  text: string,
  posMap: number[],
  issues: DetectedIssue[],
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const issue of dropOverlaps(issues)) {
    const range = toDoc(posMap, issue.offset, issue.length);
    if (!range) continue;

    const suggestion: Suggestion = {
      id: `${blockId}:${issue.ruleId}:${issue.offset}:${issue.length}`,
      blockId,
      blockHash,
      from: range.from,
      to: range.to,
      original: text.slice(issue.offset, issue.offset + issue.length),
      replacements: issue.replacements.slice(0, MAX_REPLACEMENTS),
      category: issue.category,
      ruleId: issue.ruleId,
      label: issue.label,
      reason: issue.reason,
      source: issue.source,
    };
    if (issue.fix) suggestion.fix = issue.fix;
    if (issue.rewrite) {
      const wide = toDoc(posMap, issue.rewrite.offset, issue.rewrite.length);
      if (wide) suggestion.rewrite = { ...wide, text: issue.rewrite.text };
    }
    suggestions.push(suggestion);
  }

  return suggestions;
}
