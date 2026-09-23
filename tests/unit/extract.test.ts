/**
 * Unit tests for extractBlocks.
 * The critical property is that posMap turns a block offset back into the exact
 * document range, including across an accent (one code unit) and an emoji (a
 * surrogate pair, two code units), and that a hard break reads as a newline.
 */
import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/core";
import { BlockId } from "@/lib/editor/block-id";
import { extractBlocks } from "@/lib/checking/extract";

let editor: Editor | null = null;

function makeEditor(content: JSONContent): Editor {
  const ed = new Editor({
    element: document.createElement("div"),
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      BlockId,
    ],
  });
  ed.commands.setContent(content, false);
  return ed;
}

afterEach(() => {
  editor?.destroy();
  editor = null;
});

describe("extractBlocks", () => {
  it("maps offsets to document ranges through accents and emoji", () => {
    editor = makeEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "café 😀 test" }],
        },
      ],
    });

    const blocks = extractBlocks(editor.state.doc);
    expect(blocks).toHaveLength(1);
    const block = blocks[0];
    if (!block) throw new Error("expected a block");
    expect(block.text).toBe("café 😀 test");
    expect(block.posMap).toHaveLength(block.text.length);

    const doc = editor.state.doc;

    // The word "test" round-trips to the exact same characters.
    const testOffset = block.text.indexOf("test");
    const from = block.posMap[testOffset];
    const lastCharPos = block.posMap[testOffset + 3];
    if (from === undefined || lastCharPos === undefined) {
      throw new Error("missing posMap entries");
    }
    expect(doc.textBetween(from, lastCharPos + 1)).toBe("test");

    // The emoji occupies two code units and maps back to itself.
    const emojiOffset = block.text.indexOf("😀");
    const emojiFrom = block.posMap[emojiOffset];
    const emojiLast = block.posMap[emojiOffset + 1];
    if (emojiFrom === undefined || emojiLast === undefined) {
      throw new Error("missing emoji posMap entries");
    }
    expect(doc.textBetween(emojiFrom, emojiLast + 1)).toBe("😀");
  });

  it("treats a hard break as a newline", () => {
    editor = makeEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "a" },
            { type: "hardBreak" },
            { type: "text", text: "b" },
          ],
        },
      ],
    });

    const blocks = extractBlocks(editor.state.doc);
    const block = blocks[0];
    if (!block) throw new Error("expected a block");
    expect(block.text).toBe("a\nb");
    expect(block.posMap).toHaveLength(3);
  });

  it("extracts one entry per textblock with its block id", () => {
    editor = makeEditor({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Title" }],
        },
        { type: "paragraph", content: [{ type: "text", text: "Body" }] },
      ],
    });

    const blocks = extractBlocks(editor.state.doc);
    expect(blocks).toHaveLength(2);
    expect(blocks.every((b) => b.blockId.length > 0)).toBe(true);
    expect(blocks[0]?.text).toBe("Title");
    expect(blocks[1]?.text).toBe("Body");
  });
});
