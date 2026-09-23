/**
 * use-checking.ts: connect the editor to the checking pipeline.
 * On every change it extracts the document into blocks, runs the local rules
 * immediately (so tone, clarity, and style feedback is instant), and schedules
 * the changed blocks for LanguageTool through the race-safe scheduler. When
 * LanguageTool results arrive, the block's suggestions are rebuilt from the
 * current text so LanguageTool and local issues live together. The staleness
 * guard and the scheduler's aborts keep results pinned to the right words.
 */
"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
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
import type { RawMatch } from "@/types/languagetool";
import { useSuggestions } from "@/store/suggestions";
import { useEditorUI, type CheckStatus } from "@/store/editor-ui";

const LANGUAGE = "en-US";

interface CurrentBlock {
  text: string;
  posMap: number[];
  hash: string;
  pos: number | null;
}

export function useChecking(editor: Editor | null): { runCheck: () => void } {
  const setStatus = useEditorUI((s) => s.setStatus);
  const setBlockSuggestions = useSuggestions((s) => s.setBlockSuggestions);
  const clearBlock = useSuggestions((s) => s.clearBlock);

  const cacheRef = useRef<MatchCache | null>(null);
  const schedulerRef = useRef<CheckScheduler | null>(null);
  const currentRef = useRef<Map<string, CurrentBlock>>(new Map());
  const ltRef = useRef<Map<string, { hash: string; matches: RawMatch[] }>>(
    new Map(),
  );
  const docEmptyRef = useRef(true);

  // Rebuild one block's suggestions from its current text: local rules always,
  // plus LanguageTool matches when they belong to the current hash.
  const rebuildBlock = useCallback(
    (blockId: string) => {
      const block = currentRef.current.get(blockId);
      if (!block) return;
      const localIssues = runLocalRules(block.text);
      const lt = ltRef.current.get(blockId);
      const ltIssues =
        lt && lt.hash === block.hash ? lt.matches.map(matchToIssue) : [];
      const suggestions = buildSuggestions(
        blockId,
        block.hash,
        block.text,
        block.posMap,
        [...ltIssues, ...localIssues],
      );
      setBlockSuggestions(blockId, suggestions);
    },
    [setBlockSuggestions],
  );

  // Create the scheduler once. Its callbacks read the refs above, which always
  // hold the latest block state.
  useEffect(() => {
    cacheRef.current = new MatchCache();
    const scheduler = new CheckScheduler({
      check: fetchMatches,
      cache: cacheRef.current,
      language: LANGUAGE,
      isStale: (blockId, hash) => {
        const block = currentRef.current.get(blockId);
        return !block || block.hash !== hash;
      },
      onResult: (blockId, hash, matches) => {
        ltRef.current.set(blockId, { hash, matches });
        rebuildBlock(blockId);
      },
      // Map the scheduler's "idle" to "empty" when the document has no text.
      onStatus: (status: CheckStatus) => {
        if (status === "idle" && docEmptyRef.current) setStatus("empty");
        else setStatus(status);
      },
    });
    schedulerRef.current = scheduler;
    return () => {
      scheduler.dispose();
      schedulerRef.current = null;
    };
  }, [rebuildBlock, setStatus]);

  const runCheck = useCallback(() => {
    if (!editor || !schedulerRef.current) return;

    const blocks = extractBlocks(editor.state.doc);
    const next = new Map<string, CurrentBlock>();
    const inputs: { input: BlockInput; pos: number }[] = [];
    let hasText = false;

    for (const block of blocks) {
      const hash = hashBlock(block.text);
      const pos = block.posMap[0] ?? null;
      const entry: CurrentBlock = {
        text: block.text,
        posMap: block.posMap,
        hash,
        pos,
      };
      next.set(block.blockId, entry);

      const prev = currentRef.current.get(block.blockId);
      // Local rules only need to rerun when the text (hash) actually changed.
      if (!prev || prev.hash !== hash) {
        // currentRef must hold the new block before rebuild reads it.
        currentRef.current.set(block.blockId, entry);
        rebuildBlock(block.blockId);
      }

      if (block.text.trim().length > 0 && pos !== null) {
        hasText = true;
        inputs.push({
          input: { blockId: block.blockId, text: block.text, hash },
          pos,
        });
      }
    }

    // Remove suggestions for blocks that no longer exist.
    for (const blockId of currentRef.current.keys()) {
      if (!next.has(blockId)) {
        clearBlock(blockId);
        ltRef.current.delete(blockId);
      }
    }

    currentRef.current = next;
    docEmptyRef.current = !hasText;

    if (!hasText) {
      setStatus("empty");
      schedulerRef.current.schedule([]);
      return;
    }

    schedulerRef.current.schedule(orderByViewport(editor, inputs));
  }, [editor, rebuildBlock, clearBlock, setStatus]);

  // Recheck on every document change.
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => runCheck();
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor, runCheck]);

  return { runCheck };
}

/** Order blocks so viewport-visible ones are checked first (DESIGN Phase 2). */
function orderByViewport(
  editor: Editor,
  entries: { input: BlockInput; pos: number }[],
): BlockInput[] {
  try {
    const viewportBottom = window.innerHeight;
    return entries
      .map((entry) => {
        const coords = editor.view.coordsAtPos(entry.pos);
        const inView = coords.top < viewportBottom && coords.bottom > 0;
        return { input: entry.input, inView, distance: Math.abs(coords.top) };
      })
      .sort((a, b) => {
        if (a.inView !== b.inView) return a.inView ? -1 : 1;
        return a.distance - b.distance;
      })
      .map((entry) => entry.input);
  } catch {
    // coordsAtPos can throw during layout churn; fall back to document order.
    return entries.map((entry) => entry.input);
  }
}
