/**
 * Integration test: the sample document produces suggestions in all four
 * categories. Local rules supply tone and clarity on their own; correctness and
 * style come from LanguageTool, so we synthesize the two matches LanguageTool
 * would return for the sample's deliberate errors ("shiped" and "the the") and
 * confirm the assembled suggestions cover every category.
 */
import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { BlockId } from "@/lib/editor/block-id";
import { SAMPLE_DOC } from "@/lib/editor/sample-doc";
import { extractBlocks } from "@/lib/checking/extract";
import { hashBlock } from "@/lib/checking/block-hash";
import { runLocalRules } from "@/lib/checking/local-rules";
import {
  buildSuggestions,
  matchToIssue,
} from "@/lib/checking/build-suggestions";
import type { RawMatch } from "@/types/languagetool";
import type { Category, DetectedIssue } from "@/types/suggestion";

let editor: Editor | null = null;

afterEach(() => {
  editor?.destroy();
  editor = null;
});

function typoMatch(offset: number): RawMatch {
  return {
    offset,
    length: 6,
    message: "Possible spelling mistake.",
    replacements: ["shipped"],
    rule: { id: "MORFOLOGIK_RULE_EN_US", category: { id: "TYPOS" } },
  };
}

function repeatMatch(offset: number): RawMatch {
  return {
    offset,
    length: 7,
    message: "Word repeated.",
    replacements: ["the"],
    rule: { id: "ENGLISH_WORD_REPEAT_RULE", category: { id: "REPETITIONS" } },
  };
}

describe("sample document coverage", () => {
  it("produces suggestions in all four categories", () => {
    editor = new Editor({
      element: document.createElement("div"),
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2] } }),
        BlockId,
      ],
    });
    editor.commands.setContent(SAMPLE_DOC, false);

    const blocks = extractBlocks(editor.state.doc);
    const categories = new Set<Category>();

    for (const block of blocks) {
      const ltIssues: DetectedIssue[] = [];
      const typoIdx = block.text.indexOf("shiped");
      if (typoIdx >= 0) ltIssues.push(matchToIssue(typoMatch(typoIdx)));
      const repIdx = block.text.indexOf("the the");
      if (repIdx >= 0) ltIssues.push(matchToIssue(repeatMatch(repIdx)));

      const suggestions = buildSuggestions(
        block.blockId,
        hashBlock(block.text),
        block.text,
        block.posMap,
        [...ltIssues, ...runLocalRules(block.text)],
      );
      for (const s of suggestions) categories.add(s.category);
    }

    expect(categories.has("correctness")).toBe(true);
    expect(categories.has("clarity")).toBe(true);
    expect(categories.has("tone")).toBe(true);
    expect(categories.has("style")).toBe(true);
  });
});
