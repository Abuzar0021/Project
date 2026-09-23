/**
 * MarginRail: the signature component. A column of notes, each pinned level with
 * the line its mark sits on, sliding to avoid overlap via the pure layout
 * algorithm. It measures anchor tops from the editor and note heights from the
 * DOM, batches every recalculation into one requestAnimationFrame, animates the
 * active note level with its line, draws a leader line on hover, and collapses
 * to a dot rail on tablet. Reads visible suggestions from the stores.
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useSuggestions } from "@/store/suggestions";
import { useEditorUI } from "@/store/editor-ui";
import { usePrefs } from "@/store/prefs";
import { visibleSuggestions } from "@/lib/suggestions/visibility";
import { layoutRail } from "@/lib/layout/rail-layout";
import { useMediaQuery } from "@/components/ui/use-media-query";
import { useSuggestionActions } from "@/components/card/use-suggestion-actions";
import { RailNote } from "./RailNote";
import { LeaderLine } from "./LeaderLine";
import styles from "./MarginRail.module.css";

const ESTIMATED_HEIGHT = 64;

export function MarginRail({ editor }: { editor: Editor | null }) {
  const byId = useSuggestions((s) => s.byId);
  const filter = useEditorUI((s) => s.filter);
  const activeId = useEditorUI((s) => s.activeSuggestionId);
  const activeSource = useEditorUI((s) => s.activeSource);
  const setActive = useEditorUI((s) => s.setActiveSuggestion);
  const hoveredId = useEditorUI((s) => s.hoveredSuggestionId);
  const setHovered = useEditorUI((s) => s.setHoveredSuggestion);
  const ignoredRules = usePrefs((s) => s.ignoredRules);
  const dictionary = usePrefs((s) => s.dictionary);
  const dismissed = usePrefs((s) => s.dismissed);
  const actions = useSuggestionActions(editor);
  const dotMode = useMediaQuery("(min-width: 768px) and (max-width: 1099px)");

  const suggestions = useMemo(
    () =>
      visibleSuggestions(Object.values(byId), {
        ignoredRules,
        dictionary,
        dismissed,
      })
        .filter((s) => filter === "all" || s.category === filter)
        .sort((a, b) => a.from - b.from || (a.id < b.id ? -1 : 1)),
    [byId, filter, ignoredRules, dictionary, dismissed],
  );

  const railRef = useRef<HTMLElement>(null);
  const noteEls = useRef<Map<string, HTMLElement>>(new Map());
  const rafRef = useRef<number | null>(null);
  const [tops, setTops] = useState<Map<string, number>>(new Map());
  const [railHeight, setRailHeight] = useState(0);

  const registerRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) noteEls.current.set(id, el);
    else noteEls.current.delete(id);
  }, []);

  // All layout recalculation is batched into a single frame (DESIGN 8.3).
  const recompute = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const rail = railRef.current;
      if (!editor || !rail) return;
      const railTop = rail.getBoundingClientRect().top;

      const inputs = [];
      for (const s of suggestions) {
        let anchorTop = 0;
        try {
          anchorTop = editor.view.coordsAtPos(s.from).top - railTop;
        } catch {
          continue;
        }
        const el = noteEls.current.get(s.id);
        inputs.push({
          id: s.id,
          anchorTop,
          height: el?.offsetHeight ?? ESTIMATED_HEIGHT,
        });
      }

      const placed = layoutRail(
        inputs,
        activeSource === "rail" ? activeId : null,
      );
      setTops(new Map(placed.map((p) => [p.id, p.top])));

      let maxBottom = 0;
      for (const p of placed) {
        const el = noteEls.current.get(p.id);
        maxBottom = Math.max(
          maxBottom,
          p.top + (el?.offsetHeight ?? ESTIMATED_HEIGHT),
        );
      }
      setRailHeight(Math.max(maxBottom, editor.view.dom.offsetHeight));
    });
  }, [editor, suggestions, activeId, activeSource]);

  useEffect(() => {
    recompute();
  }, [recompute]);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => recompute();
    editor.on("update", onUpdate);
    window.addEventListener("resize", recompute);
    let mounted = true;
    void document.fonts?.ready.then(() => {
      if (mounted) recompute();
    });
    return () => {
      editor.off("update", onUpdate);
      window.removeEventListener("resize", recompute);
      mounted = false;
    };
  }, [editor, recompute]);

  const onActivate = useCallback(
    (id: string) => {
      // Dot rail opens the card; the full rail expands the note inline.
      setActive(id, dotMode ? "mark" : "rail");
      const markEl = editor?.view.dom.querySelector(
        `[data-suggestion-id="${id}"]`,
      );
      markEl?.scrollIntoView({ block: "nearest" });
    },
    [setActive, dotMode, editor],
  );

  const hoveredSuggestion = hoveredId ? (byId[hoveredId] ?? null) : null;
  const isEmpty = suggestions.length === 0;

  return (
    <aside
      ref={railRef}
      className={`${styles.rail} ${dotMode ? styles.dotRail : ""}`}
      style={{ height: railHeight || undefined }}
      aria-label="Suggestions"
      role={isEmpty ? undefined : "list"}
    >
      {isEmpty ? (
        <p className={styles.empty}>No suggestions right now.</p>
      ) : (
        suggestions.map((s) => (
          <RailNote
            key={s.id}
            suggestion={s}
            top={tops.get(s.id) ?? 0}
            active={activeSource === "rail" && s.id === activeId}
            hovered={s.id === hoveredId}
            dotMode={dotMode}
            registerRef={registerRef}
            onActivate={() => onActivate(s.id)}
            onHover={setHovered}
            actions={actions}
          />
        ))
      )}
      <LeaderLine
        editor={editor}
        suggestion={hoveredSuggestion}
        noteEl={hoveredId ? (noteEls.current.get(hoveredId) ?? null) : null}
      />
    </aside>
  );
}
