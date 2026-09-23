/**
 * apply-suggestion.ts: replace a suggestion's range with a chosen replacement.
 * The replacement runs as a single chained transaction so one Ctrl/Cmd+Z reverts
 * it, and the new text gets the category-tint wash. Editing the range makes the
 * suggestions plugin drop the mark and the scheduler recheck the block.
 */
import type { Editor } from "@tiptap/react";
import type { Suggestion } from "@/types/suggestion";
import { flashWash } from "./wash-plugin";

export function applySuggestion(
  editor: Editor,
  suggestion: Suggestion,
  replacement: string,
): void {
  const { from, to, category } = suggestion;
  if (from >= to || to > editor.state.doc.content.size) return;

  editor.chain().focus().insertContentAt({ from, to }, replacement).run();

  flashWash(editor, from, from + replacement.length, category);
}
