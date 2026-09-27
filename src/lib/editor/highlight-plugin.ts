/**
 * Short-lived background highlights, such as new text after Accept or the
 * sentence under a hovered rhythm bar. They follow the text as it changes.
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/core";

interface Change {
  add?: { id: string; from: number; to: number; className: string };
  remove?: string;
}

const key = new PluginKey<DecorationSet>("highlight");
const META = "highlight";

/** Temporary background highlights that follow the text as it changes. */
export const Highlight = Extension.create({
  name: "highlight",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, set) => {
            let next = set.map(tr.mapping, tr.doc);
            const change = tr.getMeta(META) as Change | undefined;
            if (change?.remove) {
              next = next.remove(
                next.find().filter((d) => d.spec.id === change.remove),
              );
            }
            if (change?.add) {
              const { id, from, to, className } = change.add;
              next = next.add(tr.doc, [
                Decoration.inline(from, to, { class: className }, { id }),
              ]);
            }
            return next;
          },
        },
        props: {
          decorations: (state) => key.getState(state),
        },
      }),
    ];
  },
});

export function setHighlight(
  editor: Editor,
  id: string,
  range: { from: number; to: number; className: string } | null,
): void {
  if (editor.isDestroyed) return;
  const size = editor.state.doc.content.size;
  const add =
    range && range.from < range.to && range.to <= size
      ? { id, ...range }
      : undefined;
  editor.view.dispatch(
    editor.state.tr.setMeta(META, { remove: id, add } satisfies Change),
  );
}

/** Highlight a range, then let it go after the given time. */
export function flashHighlight(
  editor: Editor,
  from: number,
  to: number,
  className: string,
  ms: number,
): void {
  const id = `flash-${from}-${Date.now()}`;
  setHighlight(editor, id, { from, to, className });
  window.setTimeout(() => setHighlight(editor, id, null), ms);
}
