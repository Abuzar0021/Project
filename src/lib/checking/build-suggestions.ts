/**
 * build-suggestions.ts: turn detected issues into positioned Suggestions.
 * LanguageTool matches and local-rule issues both carry block-relative offsets;
 * here we use the block's posMap to convert each offset/length into ProseMirror
 * document positions, attach a stable id and the block hash (for the staleness
 * guard), and cap replacements at three. Issues whose offsets fall outside the
 * block text are skipped rather than trusted.
 */
import type { DetectedIssue, Suggestion } from "@/types/suggestion";
import type { RawMatch } from "@/types/languagetool";
import { categorizeMatch } from "./categorize";

const MAX_REPLACEMENTS = 3;

/** Convert one trimmed LanguageTool match into a DetectedIssue. */
export function matchToIssue(match: RawMatch): DetectedIssue {
  const { category, title, message } = categorizeMatch(match);
  return {
    offset: match.offset,
    length: match.length,
    ruleId: match.rule.id,
    category,
    title,
    message,
    replacements: match.replacements.slice(0, MAX_REPLACEMENTS),
    source: "languagetool",
  };
}

/** Map detected issues in one block to positioned Suggestions. */
export function buildSuggestions(
  blockId: string,
  blockHash: string,
  text: string,
  posMap: number[],
  issues: DetectedIssue[],
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const issue of issues) {
    const { offset, length } = issue;
    if (length <= 0) continue;
    if (offset < 0 || offset >= posMap.length) continue;

    const endIndex = Math.min(offset + length - 1, posMap.length - 1);
    const from = posMap[offset];
    const lastCharPos = posMap[endIndex];
    if (from === undefined || lastCharPos === undefined) continue;
    const to = lastCharPos + 1;

    suggestions.push({
      id: `${blockId}:${issue.ruleId}:${offset}:${length}`,
      blockId,
      blockHash,
      from,
      to,
      original: text.slice(offset, offset + length),
      replacements: issue.replacements.slice(0, MAX_REPLACEMENTS),
      category: issue.category,
      ruleId: issue.ruleId,
      title: issue.title,
      message: issue.message,
      source: issue.source,
    });
  }

  return suggestions;
}
