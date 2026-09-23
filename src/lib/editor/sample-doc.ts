/**
 * sample-doc.ts: the draft loaded on a visitor's first visit.
 * The text is taken verbatim from the build brief and contains deliberate
 * spelling, grammar, wordiness, hedging, and repetition errors so every
 * suggestion category has something to show once checking is wired up. Block ids
 * are assigned automatically by the BlockId extension, so none are set here.
 */
import type { JSONContent } from "@tiptap/core";

const PARAGRAPHS = [
  "Last week our team shiped the new onboarding flow. Their was alot of debate about wether we should keep the old checklist, but in the end we just sort of decided to remove it. I think the new version is maybe better, but it is very hard to say for sure untill we see the numbers.",
  "The report was written by the analytics team and it was reviewed by the product team and it was then sent to the leadership group who asked for a number of changes to the way that retention was being calculated across the different cohorts that we track.",
  "Next steps: collect feedback, fix the the edge cases, and share results on Friday.",
];

export const SAMPLE_DOC: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Weekly product update" }],
    },
    ...PARAGRAPHS.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  ],
};

/** Title shown in the top bar for a fresh draft. */
export const DEFAULT_TITLE = "Untitled draft";
