"use client";

import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { DetectedIssue } from "@/types/suggestion";
import { extractBlocks } from "@/lib/checking/extract";
import { hashBlock } from "@/lib/checking/block-hash";
import { runLocalRules } from "@/lib/checking/local-rules";
import { buildSuggestions } from "@/lib/checking/build-suggestions";
import { voiceIssues } from "@/lib/voice/notes";
import type { VoiceProfile } from "@/lib/voice/profile";
import { useNotesStore } from "./notes-store";

/** The five notes the landing page shows, found by the real rules. */
function isSampleNote(issue: DetectedIssue): boolean {
  if (issue.ruleId === "local:passive") return Boolean(issue.rewrite);
  return [
    "local:wordy",
    "local:spelling",
    "local:plainer:utilize",
    "voice:we'll",
  ].includes(issue.ruleId);
}

/** Landing page demo: notes come from the sample text once, with no server calls. */
export function useSampleNotes(
  editor: Editor | null,
  profile: VoiceProfile | undefined,
): void {
  const store = useNotesStore();

  useEffect(() => {
    if (!editor) return;
    let done = false;

    const load = () => {
      if (done || editor.isDestroyed) return;
      const blocks = extractBlocks(editor.state.doc);
      if (blocks.length === 0) return;
      done = true;
      const suggestions = blocks.flatMap(({ blockId, text, posMap }) => {
        const issues = [
          ...runLocalRules(text),
          ...(profile ? voiceIssues(text, profile.sample, profile.count) : []),
        ].filter(isSampleNote);
        return buildSuggestions(blockId, hashBlock(text), text, posMap, issues);
      });
      store.getState().setAll(suggestions);
    };

    load();
    editor.on("update", load);
    return () => {
      editor.off("update", load);
    };
  }, [editor, profile, store]);
}
