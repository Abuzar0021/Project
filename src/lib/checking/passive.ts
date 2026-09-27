/**
 * Passive voice. When the doer is named ("by the team") and the subject is
 * short, offers the active rewrite ("The team decided the pricing").
 */

import type { DetectedIssue } from "@/types/suggestion";
import { splitSentences } from "@/lib/text/sentences";
import { IRREGULAR_PARTICIPLES } from "./phrases";

const BE = "am|is|are|was|were|be|been|being";
const PARTICIPLE = `\\w+ed|${IRREGULAR_PARTICIPLES.join("|")}`;
const PASSIVE = new RegExp(
  `\\b(${BE})\\s+(?:\\w+ly\\s+)?(${PARTICIPLE})\\b`,
  "gi",
);
// "by the team", "by our support staff": a short agent, stopped by punctuation.
const AGENT =
  /^ by ((?:the|our|your|their|a|an|my|his|her)\s+\w+(?:\s+\w+)?|[A-Z]\w+)/;
const CLAUSE_WORD =
  /^(after|before|in|on|at|for|with|to|from|during|when|and|but|so)$/i;

// Participles that usually describe a state or feeling rather than an action
// ("we'd be delighted", "the office is based in Leeds"). Without a named doer
// they are adjectives, not passive voice, so they are left alone.
const STATE_WORDS = new Set([
  "delighted",
  "pleased",
  "excited",
  "interested",
  "tired",
  "worried",
  "surprised",
  "satisfied",
  "disappointed",
  "concerned",
  "involved",
  "based",
  "located",
  "supposed",
  "used",
  "married",
  "prepared",
  "scared",
  "bored",
  "confused",
  "committed",
  "dedicated",
  "qualified",
]);

const REASON_WITH_AGENT =
  "Say who decided. Readers trust a decision more when someone owns it.";
const REASON_NO_AGENT =
  "Say who did it. The sentence gets shorter and clearer.";

function lowerFirst(text: string): string {
  if (/^I\b/.test(text)) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function passiveIssues(text: string): DetectedIssue[] {
  const issues: DetectedIssue[] = [];

  for (const sentence of splitSentences(text)) {
    PASSIVE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PASSIVE.exec(sentence.text)) !== null) {
      const participle = match[2] ?? "";
      const at = match.index;
      let end = at + match[0].length;
      let agentText = "";

      const agent = AGENT.exec(sentence.text.slice(end));
      if (agent?.[1]) {
        const words = agent[1].split(/\s+/);
        while (
          words.length > 1 &&
          CLAUSE_WORD.test(words[words.length - 1] ?? "")
        )
          words.pop();
        agentText = words.join(" ");
        end += " by ".length + agentText.length;
      }

      if (!agentText && STATE_WORDS.has(participle.toLowerCase())) continue;

      const issue: DetectedIssue = {
        offset: sentence.start + at,
        length: end - at,
        ruleId: "local:passive",
        category: "clarity",
        label: "Passive voice",
        reason: agentText ? REASON_WITH_AGENT : REASON_NO_AGENT,
        replacements: [],
        source: "local",
      };

      // Rewrite "The new pricing was decided by the team" as
      // "The team decided the new pricing" when the subject is short and clean.
      const subject = sentence.text.slice(0, at).trim();
      const subjectWords = subject.split(/\s+/).length;
      if (agentText && subject && subjectWords <= 6 && !/[,;:]/.test(subject)) {
        const active = `${lowerFirst(agentText)} ${participle.toLowerCase()}`;
        const text = `${agentText.charAt(0).toUpperCase()}${agentText.slice(1)} ${participle.toLowerCase()} ${lowerFirst(subject)}`;
        issue.replacements = [text];
        issue.fix = active;
        issue.rewrite = { offset: sentence.start, length: end, text };
      }

      issues.push(issue);
    }
  }

  return issues;
}
