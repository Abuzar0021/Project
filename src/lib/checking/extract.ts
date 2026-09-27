/**
 * Plain text per block, plus posMap: posMap[i] is the document position of
 * text[i]. Both sides count UTF-16 code units, so accents and emoji map exactly.
 */
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { BLOCK_ID_TYPES } from "@/lib/editor/block-id";

const BLOCK_TYPE_SET = new Set<string>(BLOCK_ID_TYPES);

export interface ExtractedBlock {
  blockId: string;
  text: string;
  /** posMap[i] is the document position of text[i]. Length equals text.length. */
  posMap: number[];
}

/** Walk the document and extract one entry per textblock that has a block id. */
export function extractBlocks(doc: ProseMirrorNode): ExtractedBlock[] {
  const blocks: ExtractedBlock[] = [];

  doc.descendants((node, pos) => {
    if (!BLOCK_TYPE_SET.has(node.type.name)) return true;

    const blockId = node.attrs.blockId as string | null;
    // A block without an id has not been processed by the BlockId extension yet;
    // skip it rather than guess. It will be picked up on the next pass.
    if (!blockId) return false;

    let text = "";
    const posMap: number[] = [];

    node.forEach((child, offset) => {
      // The child's content starts one past the block's own position.
      const childPos = pos + 1 + offset;
      if (child.isText) {
        const str = child.text ?? "";
        for (let i = 0; i < str.length; i++) {
          text += str[i];
          posMap.push(childPos + i);
        }
      } else if (child.type.name === "hardBreak") {
        // A hard break reads as a newline and occupies one position.
        text += "\n";
        posMap.push(childPos);
      }
      // Any other inline node (for example an image) contributes no text and is
      // skipped safely; its positions simply do not appear in the map.
    });

    blocks.push({ blockId, text, posMap });
    // Textblocks do not nest textblocks, so no need to descend further.
    return false;
  });

  return blocks;
}
