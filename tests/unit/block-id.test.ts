/**
 * Unit tests for the BlockId extension.
 * Runs a headless TipTap editor in jsdom and checks that every textblock gets a
 * unique id, that a split gives the new half a fresh id while the original keeps
 * its own, that ids survive edits elsewhere, and that duplicate ids (as arrive
 * from a paste) are de-duplicated.
 */
import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/core";
import { BlockId } from "@/lib/editor/block-id";

const TEXTBLOCKS = new Set(["paragraph", "heading", "codeBlock"]);

let editor: Editor | null = null;

function makeEditor(): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      BlockId,
    ],
  });
}

/** Collect blockId for each textblock, in document order. */
function blockIds(ed: Editor): (string | null)[] {
  const ids: (string | null)[] = [];
  ed.state.doc.descendants((node) => {
    if (TEXTBLOCKS.has(node.type.name)) {
      ids.push((node.attrs.blockId as string | null) ?? null);
    }
    return true;
  });
  return ids;
}

afterEach(() => {
  editor?.destroy();
  editor = null;
});

describe("BlockId", () => {
  it("assigns a unique id to every textblock", () => {
    editor = makeEditor();
    const doc: JSONContent = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Title" }],
        },
        { type: "paragraph", content: [{ type: "text", text: "One" }] },
        { type: "paragraph", content: [{ type: "text", text: "Two" }] },
      ],
    };
    editor.commands.setContent(doc, false);

    const ids = blockIds(editor);
    expect(ids).toHaveLength(3);
    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(
      true,
    );
    expect(new Set(ids).size).toBe(3);
  });

  it("gives the new half a new id on split and keeps the original id", () => {
    editor = makeEditor();
    editor.commands.setContent(
      {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      },
      false,
    );
    const before = blockIds(editor);
    expect(before).toHaveLength(1);
    const originalId = before[0];

    // Split between "Hello " and "world": doc pos 1 is paragraph start.
    editor.commands.setTextSelection(7);
    editor.commands.splitBlock();

    const after = blockIds(editor);
    expect(after).toHaveLength(2);
    expect(after[0]).toBe(originalId);
    expect(after[1]).not.toBe(originalId);
    expect(after[1]).toBeTruthy();
    expect(new Set(after).size).toBe(2);
  });

  it("keeps ids stable when editing a different block", () => {
    editor = makeEditor();
    editor.commands.setContent(
      {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "First" }] },
          { type: "paragraph", content: [{ type: "text", text: "Second" }] },
        ],
      },
      false,
    );
    const before = blockIds(editor);

    // Type into the first block; ids everywhere should be unchanged.
    editor.commands.setTextSelection(2);
    editor.commands.insertContent("x");

    const after = blockIds(editor);
    expect(after).toEqual(before);
  });

  it("de-duplicates ids that arrive duplicated (as from a paste)", () => {
    editor = makeEditor();
    editor.commands.setContent(
      {
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { blockId: "dup" },
            content: [{ type: "text", text: "one" }],
          },
          {
            type: "paragraph",
            attrs: { blockId: "dup" },
            content: [{ type: "text", text: "two" }],
          },
        ],
      },
      false,
    );

    const ids = blockIds(editor);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe("dup");
    expect(ids[1]).not.toBe("dup");
    expect(new Set(ids).size).toBe(2);
  });
});
