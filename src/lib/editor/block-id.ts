/** Stable ids for paragraphs, so checks can be cached and grouped per paragraph. */

import { Extension } from "@tiptap/core";
import {
  Plugin,
  PluginKey,
  type EditorState,
  type Transaction,
} from "@tiptap/pm/state";

/**
 * Every textblock gets a stable, unique data-block-id. The checker caches and
 * groups results by block, so an id has to survive edits elsewhere and must
 * never be shared, which splits and pastes would otherwise cause.
 */
export const BLOCK_ID_TYPES = ["paragraph", "heading", "codeBlock"] as const;

const BLOCK_ID_TYPE_SET = new Set<string>(BLOCK_ID_TYPES);
const blockIdPluginKey = new PluginKey("blockId");

export function createBlockId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `b_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

/** Give missing or duplicated ids a fresh value. The first holder keeps its id. */
export function assignBlockIds(state: EditorState): Transaction | null {
  let tr = state.tr;
  let modified = false;
  const seen = new Set<string>();

  state.doc.descendants((node, pos) => {
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
    return false;
  });

  return modified ? tr.setMeta("addToHistory", false) : null;
}

export const BlockId = Extension.create({
  name: "blockId",

  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_ID_TYPES],
        attributes: {
          blockId: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-block-id"),
            renderHTML: (attributes) => {
              const id = attributes.blockId as string | null;
              return id ? { "data-block-id": id } : {};
            },
            // The second half of a split paragraph needs its own id.
            keepOnSplit: false,
          },
        },
      },
    ];
  },

  onCreate() {
    const tr = assignBlockIds(this.editor.state);
    if (tr) this.editor.view.dispatch(tr);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: blockIdPluginKey,
        appendTransaction: (transactions, _oldState, newState) =>
          transactions.some((tr) => tr.docChanged)
            ? assignBlockIds(newState)
            : null,
      }),
    ];
  },
});
