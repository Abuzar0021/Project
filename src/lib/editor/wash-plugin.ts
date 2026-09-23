/**
 * wash-plugin.ts: the brief category-tint wash over freshly applied text.
 * When a fix is applied we flash a tint on the new range for 600ms (DESIGN 6),
 * which confirms what changed without moving anything. The tint is a mapped
 * inline decoration so it follows further edits, and it is removed after the
 * duration. Under reduced motion the CSS shows a static tint (no fade) for the
 * same 600ms.
 */
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";
import type { Category } from "@/types/suggestion";

const WASH_MS = 600;

export const washPluginKey = new PluginKey<DecorationSet>("wash");

const ADD_WASH = "addWash";
const CLEAR_WASH = "clearWash";

interface AddWashMeta {
  id: string;
  from: number;
  to: number;
  category: Category;
}

export function createWashPlugin(): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key: washPluginKey,
    state: {
      init: () => DecorationSet.empty,
      apply: (tr, value) => {
        const add = tr.getMeta(ADD_WASH) as AddWashMeta | undefined;
        const clear = tr.getMeta(CLEAR_WASH) as string | undefined;
        let set = value.map(tr.mapping, tr.doc);
        if (add) {
          const deco = Decoration.inline(
            add.from,
            add.to,
            { class: `margin-wash margin-wash--${add.category}` },
            { washId: add.id },
          );
          set = set.add(tr.doc, [deco]);
        }
        if (clear) {
          const gone = set.find().filter((d) => d.spec.washId === clear);
          set = set.remove(gone);
        }
        return set;
      },
    },
    props: {
      decorations(state) {
        return washPluginKey.getState(state);
      },
    },
  });
}

/** Flash the wash over a range, then clear it after the wash duration. */
export function flashWash(
  editor: Editor,
  from: number,
  to: number,
  category: Category,
): void {
  if (from >= to) return;
  const id = `wash-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  editor.view.dispatch(
    editor.state.tr.setMeta(ADD_WASH, { id, from, to, category }),
  );
  setTimeout(() => {
    if (editor.isDestroyed) return;
    editor.view.dispatch(editor.state.tr.setMeta(CLEAR_WASH, id));
  }, WASH_MS);
}
