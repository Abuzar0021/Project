/**
 * use-margin-editor.ts: builds the TipTap editor Margin uses.
 * Keeps the editor configuration (extensions, editor props) in one place so the
 * shell can focus on layout and autosave. Native browser spellcheck is turned
 * off because Margin draws its own suggestion marks and two overlapping sets of
 * squiggles would be confusing.
 */
"use client";

import { useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { BlockId } from "@/lib/editor/block-id";

const PLACEHOLDER =
  "Start writing, or paste a draft. Suggestions appear in the margin.";

export function useMarginEditor(): Editor | null {
  return useEditor({
    // The document is loaded client-side after mount (from storage or the
    // sample), so render nothing on the server and avoid a hydration mismatch.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Placeholder.configure({
        placeholder: PLACEHOLDER,
        // Only show the prompt on a truly empty document, not every empty line.
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
      BlockId,
    ],
    editorProps: {
      attributes: {
        "aria-label": "Document editor",
        spellcheck: "false",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
  });
}
