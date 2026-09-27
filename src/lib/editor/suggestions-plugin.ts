import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import type { Suggestion } from "@/types/suggestion";

export const suggestionsPluginKey = new PluginKey<SuggestionsPluginState>(
  "suggestions",
);

/** Meta key that asks the plugin to redraw its marks. */
export const REBUILD_META = "rebuildSuggestions";

export interface RebuildMeta {
  suggestions: Suggestion[];
  activeId?: string | null;
  goneIds?: string[];
}

interface PositionSync {
  id: string;
  from: number;
  to: number;
}

export interface SuggestionsPluginState {
  decorations: DecorationSet;
  /** Marks removed by the last transaction because an edit touched them. */
  removedIds: string[];
  /** Marks that moved in the last transaction. */
  syncs: PositionSync[];
}

interface Range {
  from: number;
  to: number;
}

export const noteElementId = (suggestionId: string) =>
  `note-${suggestionId.replace(/[^\w-]/g, "_")}`;

export function buildDecorationSet(
  doc: ProseMirrorNode,
  meta: RebuildMeta,
): DecorationSet {
  const max = doc.content.size;
  const gone = new Set(meta.goneIds ?? []);
  const decorations: Decoration[] = [];

  for (const s of meta.suggestions) {
    if (s.from < 0 || s.to > max || s.from >= s.to) continue;
    let className = `mark mark-${s.category}`;
    if (s.id === meta.activeId) className += " is-active";
    if (gone.has(s.id)) className += " is-gone";
    decorations.push(
      Decoration.inline(
        s.from,
        s.to,
        {
          class: className,
          "data-suggestion-id": s.id,
          "aria-describedby": noteElementId(s.id),
        },
        { id: s.id, type: "mark" },
      ),
    );
  }

  return DecorationSet.create(doc, decorations);
}

/** Ranges a transaction changed, in final document positions. */
export function changedRanges(tr: Transaction): Range[] {
  const ranges: Range[] = [];
  const maps = tr.mapping.maps;
  maps.forEach((map, index) => {
    map.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
      let from = newStart;
      let to = newEnd;
      for (let j = index + 1; j < maps.length; j++) {
        const later = maps[j];
        if (!later) continue;
        from = later.map(from, -1);
        to = later.map(to, 1);
      }
      ranges.push({ from, to });
    });
  });
  return ranges;
}

const intersects = (from: number, to: number, ranges: Range[]) =>
  ranges.some((range) => from < range.to && to > range.from);

export function createSuggestionsPlugin(options: {
  onRemove: (ids: string[]) => void;
  onSync: (updates: PositionSync[]) => void;
}): Plugin<SuggestionsPluginState> {
  return new Plugin<SuggestionsPluginState>({
    key: suggestionsPluginKey,
    state: {
      init: () => ({
        decorations: DecorationSet.empty,
        removedIds: [],
        syncs: [],
      }),
      apply: (tr, value): SuggestionsPluginState => {
        const meta = tr.getMeta(REBUILD_META) as RebuildMeta | undefined;
        if (meta) {
          return {
            decorations: buildDecorationSet(tr.doc, meta),
            removedIds: [],
            syncs: [],
          };
        }

        if (!tr.docChanged) {
          return value.removedIds.length || value.syncs.length
            ? { decorations: value.decorations, removedIds: [], syncs: [] }
            : value;
        }

        const changed = changedRanges(tr);
        if (changed.length === 0) {
          // Attribute-only steps (block ids) move nothing. Keep the outputs of the
          // real edit so the view still reports them once.
          return {
            decorations: value.decorations.map(tr.mapping, tr.doc),
            removedIds: value.removedIds,
            syncs: value.syncs,
          };
        }

        const before = new Map<string, Range>();
        for (const deco of value.decorations.find()) {
          before.set(deco.spec.id as string, { from: deco.from, to: deco.to });
        }

        const mapped = value.decorations.map(tr.mapping, tr.doc);
        const touched = mapped
          .find()
          .filter((deco) => intersects(deco.from, deco.to, changed));
        // Read the ids first: DecorationSet.remove clears the array it is given.
        const removedIds = touched.map((deco) => deco.spec.id as string);
        const next = touched.length ? mapped.remove(touched) : mapped;

        const syncs: PositionSync[] = [];
        for (const deco of next.find()) {
          const id = deco.spec.id as string;
          const old = before.get(id);
          if (old && (old.from !== deco.from || old.to !== deco.to)) {
            syncs.push({ id, from: deco.from, to: deco.to });
          }
        }

        return {
          decorations: next,
          removedIds,
          syncs,
        };
      },
    },
    props: {
      decorations: (state) => suggestionsPluginKey.getState(state)?.decorations,
    },
    view: () => ({
      update: (view) => {
        const state = suggestionsPluginKey.getState(view.state);
        if (!state) return;
        if (state.removedIds.length) options.onRemove(state.removedIds);
        if (state.syncs.length) options.onSync(state.syncs);
      },
    }),
  });
}
