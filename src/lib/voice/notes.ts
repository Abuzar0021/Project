import type { DetectedIssue } from "@/types/suggestion";
import { PAIRS, type VoiceSample } from "./features";
import { matchCase } from "@/lib/checking/local-rules";

/** Enough evidence before Margin claims something is a habit. */
const MIN_USES = 3;
const HABIT = 0.9;

function drafts(count: number): string {
  return count === 1 ? "your 1 draft" : `your ${count} drafts`;
}

/** Flag phrases that break a strong habit in the writer's own drafts. */
export function voiceIssues(
  text: string,
  profile: VoiceSample,
  samples: number,
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];

  for (const pair of PAIRS) {
    const habit = profile.contractions[pair.short];
    if (!habit || habit.short < MIN_USES) continue;
    if (habit.short / (habit.short + habit.long) < HABIT) continue;

    for (const form of pair.long) {
      const pattern = new RegExp(`\\b${form.replace(/ /g, "\\s+")}\\b`, "gi");
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const found = match[0];
        const usage = habit.long === 0 ? "never" : "rarely";
        issues.push({
          offset: match.index,
          length: found.length,
          ruleId: `voice:${pair.short}`,
          category: "voice",
          label: "Not your voice",
          reason: `Across ${drafts(samples)} you write "${pair.short}", ${usage} "${form}".`,
          replacements: [matchCase(found, pair.short)],
          source: "voice",
        });
      }
    }
  }

  if (profile.words >= 300 && (profile.formal.kindly ?? 0) === 0) {
    const pattern = /\bkindly\b/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      issues.push({
        offset: match.index,
        length: match[0].length,
        ruleId: "voice:kindly",
        category: "voice",
        label: "Not your voice",
        reason: `You never write "kindly" in ${drafts(samples)}. "Please" sounds like you.`,
        replacements: [matchCase(match[0], "please")],
        source: "voice",
      });
    }
  }

  return issues;
}
