/**
 * suggestions-plugin.ts: the ProseMirror plugin that draws suggestion marks and
 * keeps them anchored. It holds a DecorationSet built from the store's
 * suggestions. On every document change it maps the set through the transaction
 * so marks follow the text, removes any mark whose range an edit touched (that
 * block will be rechecked), and reports mapped positions and removals back to
 * React so the store stays in sync. Marks are rebuilt from the store, filtered
 * by category, whenever the set of suggestions or the active filter changes.
 *
 * The plugin owns no React state; it talks out through the callbacks passed to
 * createSuggestionsPlugin, which keeps the mapping and intersection logic
 * testable in isolation.
 */
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import type { CategoryFilter, Suggestion } from "@/types/suggestion";
import { CATEGORY_LABELS } from "@/types/suggestion";

export const suggestionsPluginKey = new PluginKey<SuggestionsPluginState>(
  "suggestions",
);

/** Meta payload that asks the plugin to rebuild its marks from the store. */
export const REBUILD_META = "rebuildSuggestions";

interface RebuildMeta {
  suggestions: Suggestion[];
  filter: CategoryFilter;
}

interface PositionSync {
  id: string;
  from: number;
  to: number;
}

export interface SuggestionsPluginState {
  decorations: DecorationSet;
  /** Ids removed by the last transaction because an edit touched them. */
  removedIds: string[];
  /** Position updates for marks that moved in the last transaction. */
  syncs: PositionSync[];
}

interface SuggestionsPluginOptions {
  onRemove: (ids: string[]) => void;
  onSync: (updates: PositionSync[]) => void;
}

interface Range {
  from: number;
  to: number;
}

/** Build the decoration id used for a mark's hidden description element. */
function descriptionId(suggestionId: string): string {
  return `msug-${suggestionId}`;
}

/** Create the underline + hidden-description decorations for the suggestions. */
export function buildDecorationSet(
  doc: ProseMirrorNode,
  suggestions: Suggestion[],
  filter: CategoryFilter,
): DecorationSet {
  const decorations: Decoration[] = [];
  const max = doc.content.size;

  for (const suggestion of suggestions) {
    if (filter !== "all" && suggestion.category !== filter) continue;
    const { from, to, id, category } = suggestion;
    // Guard against positions that fall outside the current document.
    if (from < 0 || to > max || from >= to) continue;

    decorations.push(
      Decoration.inline(
        from,
        to,
        {
          class: `margin-mark margin-mark--${category}`,
          "data-suggestion-id": id,
          "aria-describedby": descriptionId(id),
        },
        { id, category, type: "mark" },
      ),
    );

    // A visually hidden description, referenced by the mark for screen readers.
    decorations.push(
      Decoration.widget(
        to,
        () => {
          const span = document.createElement("span");
          span.className = "margin-visually-hidden";
          span.id = descriptionId(id);
          span.textContent = `${CATEGORY_LABELS[category]} suggestion: ${suggestion.title.toLowerCase()}`;
          return span;
        },
        { side: 1, key: `desc-${id}`, id, type: "desc" },
      ),
    );
  }

  return DecorationSet.create(doc, decorations);
}

/** Compute the changed ranges of a transaction in final-document coordinates. */
export function changedRanges(tr: Transaction): Range[] {
  const ranges: Range[] = [];
  const maps = tr.mapping.maps;
  maps.forEach((map, index) => {
    map.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
      let from = newStart;
      let to = newEnd;
      // Carry the range forward through the remaining steps to final coords.
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

function intersectsAny(from: number, to: number, ranges: Range[]): boolean {
  return ranges.some((range) => from < range.to && to > range.from);
}

export function createSuggestionsPlugin(
  options: SuggestionsPluginOptions,
): Plugin<SuggestionsPluginState> {
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
            decorations: buildDecorationSet(
              tr.doc,
              meta.suggestions,
              meta.filter,
            ),
            removedIds: [],
            syncs: [],
          };
        }

        if (!tr.docChanged) {
          // Selection-only change: keep marks, clear transient outputs.
          return value.removedIds.length || value.syncs.length
            ? { decorations: value.decorations, removedIds: [], syncs: [] }
            : value;
        }

        const changed = changedRanges(tr);
        if (changed.length === 0) {
          // A transaction with no positional change, such as the attribute-only
          // transaction the BlockId extension appends. Mapping is identity, so
          // carry the previous transient outputs forward: the plugin view runs
          // once per dispatch and must still see removals from the real edit.
          return {
            decorations: value.decorations.map(tr.mapping, tr.doc),
            removedIds: value.removedIds,
            syncs: value.syncs,
          };
        }

        // Remember pre-map positions so we can report what moved.
        const oldPositions = new Map<string, Range>();
        for (const deco of value.decorations.find()) {
          if (deco.spec.type !== "mark") continue;
          const id = deco.spec.id as string;
          oldPositions.set(id, { from: deco.from, to: deco.to });
        }

        const mapped = value.decorations.map(tr.mapping, tr.doc);

        // Any mark whose range an edit touched is removed at once.
        const removed = new Set<string>();
        for (const deco of mapped.find()) {
          if (deco.spec.type !== "mark") continue;
          if (intersectsAny(deco.from, deco.to, changed)) {
            removed.add(deco.spec.id as string);
          }
        }

        const toRemove = removed.size
          ? mapped.find().filter((d) => removed.has(d.spec.id as string))
          : [];
        const next = toRemove.length ? mapped.remove(toRemove) : mapped;

        // Report survivors whose position changed, for the store.
        const syncs: PositionSync[] = [];
        for (const deco of next.find()) {
          if (deco.spec.type !== "mark") continue;
          const id = deco.spec.id as string;
          const old = oldPositions.get(id);
          if (old && (old.from !== deco.from || old.to !== deco.to)) {
            syncs.push({ id, from: deco.from, to: deco.to });
          }
        }

        return { decorations: next, removedIds: [...removed], syncs };
      },
    },
    props: {
      decorations(state) {
        return suggestionsPluginKey.getState(state)?.decorations;
      },
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
