/**
 * use-suggestion-decorations.ts: connect the suggestions plugin to the stores.
 * It registers the plugin on the editor, forwards the plugin's removals and
 * position syncs into the suggestions store, and rebuilds the marks whenever the
 * set of suggestion ids or the active category filter changes. Position syncs do
 * not change the id set, so they never trigger a rebuild, which keeps the two
 * from looping.
 */
"use client";

import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  createSuggestionsPlugin,
  suggestionsPluginKey,
  REBUILD_META,
} from "@/lib/editor/suggestions-plugin";
import { useSuggestions } from "@/store/suggestions";
import { useEditorUI } from "@/store/editor-ui";
import { usePrefs } from "@/store/prefs";
import { visibleSuggestions } from "@/lib/suggestions/visibility";

export function useSuggestionDecorations(editor: Editor | null): void {
  const removeSuggestion = useSuggestions((s) => s.removeSuggestion);
  const updatePositions = useSuggestions((s) => s.updatePositions);
  const byId = useSuggestions((s) => s.byId);
  const filter = useEditorUI((s) => s.filter);
  const activeId = useEditorUI((s) => s.activeSuggestionId);
  const ignoredRules = usePrefs((s) => s.ignoredRules);
  const dictionary = usePrefs((s) => s.dictionary);
  const dismissed = usePrefs((s) => s.dismissed);
  const lastSignature = useRef<string>("");

  // Register the plugin once per editor instance.
  useEffect(() => {
    if (!editor) return;
    const plugin = createSuggestionsPlugin({
      onRemove: (ids) => {
        for (const id of ids) removeSuggestion(id);
      },
      onSync: (updates) => updatePositions(updates),
    });
    editor.registerPlugin(plugin);
    lastSignature.current = "";
    return () => {
      editor.unregisterPlugin(suggestionsPluginKey);
    };
  }, [editor, removeSuggestion, updatePositions]);

  // Rebuild marks when the visible suggestion set, the filter, or the active
  // suggestion changes. Position syncs keep the id set the same, so they never
  // trigger a rebuild.
  useEffect(() => {
    if (!editor) return;
    const suggestions = visibleSuggestions(Object.values(byId), {
      ignoredRules,
      dictionary,
      dismissed,
    });
    const signature = `${suggestions
      .map((s) => s.id)
      .sort()
      .join("|")}::${filter}::${activeId ?? ""}`;
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;
    editor.view.dispatch(
      editor.state.tr.setMeta(REBUILD_META, { suggestions, filter, activeId }),
    );
  }, [editor, byId, filter, activeId, ignoredRules, dictionary, dismissed]);
}
