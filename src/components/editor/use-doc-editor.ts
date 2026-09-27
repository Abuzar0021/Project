"use client";

/** Builds the TipTap editor with the extensions Margin needs. */

import { useEditor, type Editor } from "@tiptap/react";
import { Extension, type JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { StoreApi } from "zustand";
import { BlockId } from "@/lib/editor/block-id";
import { Highlight } from "@/lib/editor/highlight-plugin";
import { createSuggestionsPlugin } from "@/lib/editor/suggestions-plugin";
import type { NotesState } from "./notes-store";

export function useDocEditor(
  store: StoreApi<NotesState>,
  content: JSONContent,
  label: string,
): Editor | null {
  return useEditor({
    immediatelyRender: false,
    content,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing. Notes will appear in the margin.",
      }),
      BlockId,
      Highlight,
      Extension.create({
        name: "marks",
        addProseMirrorPlugins: () => [
          createSuggestionsPlugin({
            onRemove: (ids) => store.getState().remove(ids),
            onSync: (updates) => store.getState().sync(updates),
          }),
        ],
      }),
    ],
    editorProps: {
      attributes: {
        "aria-label": label,
        "aria-multiline": "true",
        role: "textbox",
        spellcheck: "false",
      },
    },
  });
}
