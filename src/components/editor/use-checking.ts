"use client";

/**
 * Checks the draft as it changes. Local rules run at once on each edited
 * paragraph; LanguageTool results arrive through the scheduler and are merged
 * in. Results are filtered by the plan and by kept suggestions before they
 * become notes.
 */

import { useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import type { Category } from "@/types/suggestion";
import type { RawMatch } from "@/types/languagetool";
import { MatchCache } from "@/lib/checking/cache";
import { CheckScheduler, type BlockInput } from "@/lib/checking/scheduler";
import { extractBlocks } from "@/lib/checking/extract";
import { hashBlock } from "@/lib/checking/block-hash";
import { runLocalRules } from "@/lib/checking/local-rules";
import {
  buildSuggestions,
  matchToIssue,
} from "@/lib/checking/build-suggestions";
import { fetchMatches } from "@/lib/checking/languagetool";
import { voiceIssues } from "@/lib/voice/notes";
import type { VoiceProfile } from "@/lib/voice/profile";
import { isKept, type StetRule } from "@/lib/stet";
import { useNotesStore } from "./notes-store";

export interface CheckOptions {
  draftId: string;
  categories: Category[];
  profile: VoiceProfile | null;
  kept: StetRule[];
}

interface Block {
  text: string;
  posMap: number[];
  hash: string;
}

export function useChecking(
  editor: Editor | null,
  options: CheckOptions,
): void {
  const store = useNotesStore();
  const optionsRef = useRef(options);
  const blocksRef = useRef(new Map<string, Block>());
  const serverRef = useRef(
    new Map<string, { hash: string; matches: RawMatch[] }>(),
  );
  const schedulerRef = useRef<CheckScheduler | null>(null);

  const rebuild = useCallback(
    (blockId: string) => {
      const block = blocksRef.current.get(blockId);
      if (!block) return;
      const { categories, profile, kept, draftId } = optionsRef.current;
      const server = serverRef.current.get(blockId);
      const issues = [
        ...(server?.hash === block.hash
          ? server.matches.map(matchToIssue)
          : []),
        ...runLocalRules(block.text),
        ...(profile && categories.includes("voice")
          ? voiceIssues(block.text, profile.sample, profile.count)
          : []),
      ].filter((issue) => categories.includes(issue.category));

      const suggestions = buildSuggestions(
        blockId,
        block.hash,
        block.text,
        block.posMap,
        issues,
      ).filter((s) => !isKept(s, kept, draftId));
      store.getState().setBlock(blockId, suggestions);
    },
    [store],
  );

  useEffect(() => {
    const scheduler = new CheckScheduler({
      check: fetchMatches,
      cache: new MatchCache(),
      isStale: (blockId, hash) => blocksRef.current.get(blockId)?.hash !== hash,
      onResult: (blockId, hash, matches) => {
        serverRef.current.set(blockId, { hash, matches });
        rebuild(blockId);
      },
      onStatus: (status) => store.getState().setStatus(status),
    });
    schedulerRef.current = scheduler;
    return () => scheduler.dispose();
  }, [rebuild, store]);

  const run = useCallback(
    (force: boolean) => {
      if (!editor || editor.isDestroyed) return;
      const next = new Map<string, Block>();
      const queue: BlockInput[] = [];

      for (const { blockId, text, posMap } of extractBlocks(editor.state.doc)) {
        const block = { text, posMap, hash: hashBlock(text) };
        const previous = blocksRef.current.get(blockId);
        next.set(blockId, block);
        blocksRef.current.set(blockId, block);
        if (force || previous?.hash !== block.hash) rebuild(blockId);
        if (text.trim()) queue.push({ blockId, text, hash: block.hash });
      }

      for (const blockId of blocksRef.current.keys()) {
        if (!next.has(blockId)) store.getState().clearBlock(blockId);
      }
      blocksRef.current = next;
      schedulerRef.current?.schedule(queue);
    },
    [editor, rebuild, store],
  );

  useEffect(() => {
    optionsRef.current = options;
    run(true);
  }, [options, run]);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => run(false);
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor, run]);
}
