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

export function useSuggestionDecorations(editor: Editor | null): void {
  const removeSuggestion = useSuggestions((s) => s.removeSuggestion);
  const updatePositions = useSuggestions((s) => s.updatePositions);
  const byId = useSuggestions((s) => s.byId);
  const filter = useEditorUI((s) => s.filter);
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

  // Rebuild marks when the suggestion id set or the filter changes.
  useEffect(() => {
    if (!editor) return;
    const suggestions = Object.values(byId);
    const signature = `${suggestions
      .map((s) => s.id)
      .sort()
      .join("|")}::${filter}`;
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;
    editor.view.dispatch(
      editor.state.tr.setMeta(REBUILD_META, { suggestions, filter }),
    );
  }, [editor, byId, filter]);
}
