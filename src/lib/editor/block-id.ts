/**
 * block-id.ts: a TipTap extension that gives every textblock a stable, unique
 * `data-block-id`. The checking pipeline keys its cache and suggestions by block
 * id, so an id must survive edits elsewhere in the document and must never be
 * shared by two blocks (which happens on split and paste). We assign ids in an
 * appendTransaction pass and de-duplicate in document order: the first block to
 * hold an id keeps it, any later block carrying the same id is reissued.
 *
 * This is a hand-rolled replacement for the paid UniqueID extension. It has no
 * React imports so it can be unit tested against a headless editor.
 */
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/** Node types that should carry a block id. These are the textblocks StarterKit
 * provides; paragraphs inside list items are plain paragraphs, so they are
 * covered too. */
export const BLOCK_ID_TYPES = ["paragraph", "heading", "codeBlock"] as const;

const blockIdPluginKey = new PluginKey("blockId");

/** Generate a collision-resistant id. Uses crypto.randomUUID where available
 * (browser and Node), with a random fallback for older runtimes. */
export function createBlockId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `b_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

const BLOCK_ID_TYPE_SET = new Set<string>(BLOCK_ID_TYPES);

export const BlockId = Extension.create({
  name: "blockId",

  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_ID_TYPES],
        attributes: {
          blockId: {
            default: null,
            // Rendered so the id is queryable in the DOM as data-block-id.
            parseHTML: (element) => element.getAttribute("data-block-id"),
            renderHTML: (attributes) => {
              const id = attributes.blockId as string | null;
              return id ? { "data-block-id": id } : {};
            },
            // On split the new half should get a fresh id, so do not copy it.
            keepOnSplit: false,
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: blockIdPluginKey,
        // Assign ids after any doc-changing transaction. Returning a transaction
        // here appends it atomically, so ids land in the same undo step as the
        // edit that created the block.
        appendTransaction: (transactions, _oldState, newState) => {
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;

          let tr = newState.tr;
          let modified = false;
          const seen = new Set<string>();

          newState.doc.descendants((node, pos) => {
            if (!BLOCK_ID_TYPE_SET.has(node.type.name)) return true;
            const id = node.attrs.blockId as string | null;
            if (!id || seen.has(id)) {
              const nextId = createBlockId();
              tr = tr.setNodeAttribute(pos, "blockId", nextId);
              seen.add(nextId);
              modified = true;
            } else {
              seen.add(id);
            }
            // Textblocks do not nest textblocks; no need to descend further.
            return false;
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});
