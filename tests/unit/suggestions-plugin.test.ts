/**
 * Unit tests for the suggestions plugin: marks build from the store, map through
 * an insertion before them (and report the move), disappear when an edit touches
 * their range (and report the removal), and honor the category filter. A
 * headless editor drives scripted transactions.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { BlockId } from "@/lib/editor/block-id";
import {
  createSuggestionsPlugin,
  suggestionsPluginKey,
  REBUILD_META,
} from "@/lib/editor/suggestions-plugin";
import type { Suggestion, CategoryFilter } from "@/types/suggestion";
import type { Decoration } from "@tiptap/pm/view";

let editor: Editor;
let removed: string[];
let syncs: { id: string; from: number; to: number }[];

// "Hello world foo": character i sits at document position i + 1, so the word
// "world" (indices 6..10) spans document positions 7..12.
const SUGGESTION: Suggestion = {
  id: "blk:R:6:5",
  blockId: "blk",
  blockHash: "h",
  from: 7,
  to: 12,
  original: "world",
  replacements: [],
  category: "clarity",
  ruleId: "R",
  title: "Wordy",
  message: "m",
  source: "local",
};

function markDecorations(): Decoration[] {
  const state = suggestionsPluginKey.getState(editor.state);
  return state
    ? state.decorations.find().filter((d) => d.spec.type === "mark")
    : [];
}

function rebuild(suggestions: Suggestion[], filter: CategoryFilter): void {
  editor.view.dispatch(
    editor.state.tr.setMeta(REBUILD_META, { suggestions, filter }),
  );
}

beforeEach(() => {
  editor = new Editor({
    element: document.createElement("div"),
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      BlockId,
    ],
  });
  editor.commands.setContent(
    {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world foo" }],
        },
      ],
    },
    false,
  );
  removed = [];
  syncs = [];
  editor.registerPlugin(
    createSuggestionsPlugin({
      onRemove: (ids) => removed.push(...ids),
      onSync: (updates) => syncs.push(...updates),
    }),
  );
  rebuild([SUGGESTION], "all");
});

afterEach(() => {
  editor.destroy();
});

describe("suggestions plugin", () => {
  it("builds a mark for a suggestion", () => {
    const marks = markDecorations();
    expect(marks).toHaveLength(1);
    expect(marks[0]?.from).toBe(7);
    expect(marks[0]?.to).toBe(12);
  });

  it("maps a mark through an insertion before it and reports the move", () => {
    editor.view.dispatch(editor.state.tr.insertText("AB", 1));
    const marks = markDecorations();
    expect(marks).toHaveLength(1);
    expect(marks[0]?.from).toBe(9);
    expect(marks[0]?.to).toBe(14);
    expect(removed).toHaveLength(0);
    expect(syncs).toContainEqual({ id: "blk:R:6:5", from: 9, to: 14 });
  });

  it("removes a mark when an edit touches its range", () => {
    editor.view.dispatch(editor.state.tr.insertText("X", 9));
    expect(markDecorations()).toHaveLength(0);
    expect(removed).toContain("blk:R:6:5");
  });

  it("does not remove a mark when typing right before it", () => {
    editor.view.dispatch(editor.state.tr.insertText("Z", 7));
    // Inline decorations are not inclusive at the start, so the mark shifts.
    const marks = markDecorations();
    expect(marks).toHaveLength(1);
    expect(removed).toHaveLength(0);
  });

  it("hides marks whose category is filtered out", () => {
    rebuild([SUGGESTION], "tone");
    expect(markDecorations()).toHaveLength(0);
    rebuild([SUGGESTION], "clarity");
    expect(markDecorations()).toHaveLength(1);
  });
});
