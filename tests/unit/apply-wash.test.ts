/**
 * Unit tests for applying a suggestion and the applied-fix wash. A headless
 * editor with the wash plugin proves the replacement lands and the wash
 * decoration appears then clears after its duration.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { BlockId } from "@/lib/editor/block-id";
import { createWashPlugin, washPluginKey } from "@/lib/editor/wash-plugin";
import { applySuggestion } from "@/lib/editor/apply-suggestion";
import type { Suggestion } from "@/types/suggestion";

let editor: Editor;

function suggestion(from: number, to: number): Suggestion {
  return {
    id: "blk:R:6:5",
    blockId: "blk",
    blockHash: "h",
    from,
    to,
    original: "world",
    replacements: ["planet"],
    category: "correctness",
    ruleId: "R",
    title: "Possible typo",
    message: "m",
    source: "languagetool",
  };
}

function washCount(): number {
  return washPluginKey.getState(editor.state)?.find().length ?? 0;
}

beforeEach(() => {
  vi.useFakeTimers();
  editor = new Editor({
    element: document.createElement("div"),
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      BlockId,
    ],
  });
  editor.registerPlugin(createWashPlugin());
  editor.commands.setContent(
    {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "hello world" }] },
      ],
    },
    false,
  );
});

afterEach(() => {
  editor.destroy();
  vi.useRealTimers();
});

describe("applySuggestion", () => {
  it("replaces the range and flashes a wash that clears", () => {
    // "world" spans document positions 7..12 in "hello world".
    applySuggestion(editor, suggestion(7, 12), "planet");
    expect(editor.getText()).toContain("planet");
    expect(editor.getText()).not.toContain("world");
    expect(washCount()).toBeGreaterThan(0);

    vi.advanceTimersByTime(600);
    expect(washCount()).toBe(0);
  });

  it("does nothing for an invalid range", () => {
    applySuggestion(editor, suggestion(5, 5), "planet");
    expect(editor.getText()).toContain("world");
  });
});
