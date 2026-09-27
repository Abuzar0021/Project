import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import type { Decoration } from "@tiptap/pm/view";
import { BlockId } from "@/lib/editor/block-id";
import {
  createSuggestionsPlugin,
  noteElementId,
  suggestionsPluginKey,
  REBUILD_META,
  type RebuildMeta,
} from "@/lib/editor/suggestions-plugin";
import type { Suggestion } from "@/types/suggestion";

let editor: Editor;
let removed: string[];
let syncs: { id: string; from: number; to: number }[];

// "Hello world foo": "world" spans document positions 7 to 12.
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
  label: "Wordy",
  reason: "Reason.",
  source: "local",
};

const marks = (): Decoration[] =>
  suggestionsPluginKey.getState(editor.state)?.decorations.find() ?? [];

const rebuild = (meta: RebuildMeta) =>
  editor.view.dispatch(editor.state.tr.setMeta(REBUILD_META, meta));

const markClass = () =>
  (marks()[0] as unknown as { type: { attrs: { class: string } } }).type.attrs
    .class;

beforeEach(() => {
  editor = new Editor({
    element: document.createElement("div"),
    extensions: [StarterKit, BlockId],
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world foo" }],
        },
      ],
    },
  });
  removed = [];
  syncs = [];
  editor.registerPlugin(
    createSuggestionsPlugin({
      onRemove: (ids) => removed.push(...ids),
      onSync: (updates) => syncs.push(...updates),
    }),
  );
  rebuild({ suggestions: [SUGGESTION] });
});

afterEach(() => editor.destroy());

describe("suggestions plugin", () => {
  it("draws one underline per suggestion", () => {
    expect(marks()).toHaveLength(1);
    expect(marks()[0]?.from).toBe(7);
    expect(marks()[0]?.to).toBe(12);
    expect(markClass()).toBe("mark mark-clarity");
  });

  it("marks the active note and a note being accepted", () => {
    rebuild({
      suggestions: [SUGGESTION],
      activeId: SUGGESTION.id,
      goneIds: [SUGGESTION.id],
    });
    expect(markClass()).toBe("mark mark-clarity is-active is-gone");
  });

  it("follows an insertion before it and reports the move", () => {
    editor.view.dispatch(editor.state.tr.insertText("AB", 1));
    expect(marks()[0]?.from).toBe(9);
    expect(removed).toHaveLength(0);
    expect(syncs).toContainEqual({ id: SUGGESTION.id, from: 9, to: 14 });
  });

  it("drops a mark when an edit touches it", () => {
    editor.view.dispatch(editor.state.tr.insertText("X", 9));
    expect(marks()).toHaveLength(0);
    expect(removed).toContain(SUGGESTION.id);
  });

  it("skips suggestions outside the document", () => {
    rebuild({ suggestions: [{ ...SUGGESTION, from: 90, to: 95 }] });
    expect(marks()).toHaveLength(0);
  });

  it("builds a note id that is safe to use in the DOM", () => {
    expect(noteElementId("blk:R:6:5")).toBe("note-blk_R_6_5");
  });
});
