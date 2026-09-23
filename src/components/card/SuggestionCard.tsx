/**
 * SuggestionCard: the popover (desktop) or bottom sheet (mobile) for the active
 * suggestion. It anchors to the mark with floating-ui (flip and shift so it never
 * covers the mark), wires the actions to the stores, runs the card keyboard map
 * (Enter, 1/2/3, D, Esc), and returns focus to the editor at the mark on close.
 * Rendered in a portal so opening it never shifts the editor layout.
 */
"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Editor } from "@tiptap/react";
import {
  useFloating,
  offset,
  flip,
  shift,
  FloatingPortal,
} from "@floating-ui/react";
import { useEditorUI } from "@/store/editor-ui";
import { useSuggestions } from "@/store/suggestions";
import { usePrefs } from "@/store/prefs";
import { useToast } from "@/store/toast";
import { applySuggestion } from "@/lib/editor/apply-suggestion";
import { useMediaQuery } from "@/components/ui/use-media-query";
import { Sheet } from "@/components/ui/Sheet";
import { CardBody } from "./CardBody";
import styles from "./SuggestionCard.module.css";

const EMPTY_RECT = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
} as const;

export function SuggestionCard({ editor }: { editor: Editor | null }) {
  const activeId = useEditorUI((s) => s.activeSuggestionId);
  const activeSource = useEditorUI((s) => s.activeSource);
  const setActive = useEditorUI((s) => s.setActiveSuggestion);
  const suggestion = useSuggestions((s) =>
    activeId ? s.byId[activeId] : undefined,
  );
  // The card only handles mark/dot activations; rail activations expand inline.
  const cardOpen = Boolean(suggestion) && activeSource === "mark";
  const ignoreRule = usePrefs((s) => s.ignoreRule);
  const addToDictionary = usePrefs((s) => s.addToDictionary);
  const dismiss = usePrefs((s) => s.dismiss);
  const undismiss = usePrefs((s) => s.undismiss);
  const showToast = useToast((s) => s.show);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const from = suggestion?.from ?? 0;
  const to = suggestion?.to ?? 0;

  // A live virtual anchor: reads the mark's screen rect on each reposition.
  const reference = useMemo(
    () => ({
      getBoundingClientRect: () => {
        if (!editor || from >= to) return EMPTY_RECT;
        try {
          const start = editor.view.coordsAtPos(from);
          const end = editor.view.coordsAtPos(to);
          const top = Math.min(start.top, end.top);
          const bottom = Math.max(start.bottom, end.bottom);
          const left = Math.min(start.left, end.left);
          const right = Math.max(start.right, end.right);
          return {
            x: left,
            y: top,
            top,
            left,
            right,
            bottom,
            width: right - left,
            height: bottom - top,
          };
        } catch {
          return EMPTY_RECT;
        }
      },
    }),
    [editor, from, to],
  );

  const { refs, floatingStyles, update } = useFloating({
    placement: "bottom-start",
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
  });

  useEffect(() => {
    if (!cardOpen || isMobile) return;
    refs.setPositionReference(reference);
  }, [refs, reference, cardOpen, isMobile]);

  // Keep the popover glued to the mark while the document scrolls or resizes.
  useEffect(() => {
    if (!cardOpen || isMobile) return;
    const onMove = () => update();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [cardOpen, isMobile, update]);

  const close = useCallback(() => {
    setActive(null);
    if (editor && from < editor.state.doc.content.size) {
      editor.chain().setTextSelection(from).focus().run();
    }
  }, [setActive, editor, from]);

  // Move focus into the card when it opens so the keyboard map works and screen
  // readers announce the dialog.
  useEffect(() => {
    if (!cardOpen || isMobile) return;
    refs.floating.current?.focus();
  }, [cardOpen, isMobile, refs]);

  // Close if the suggestion is gone (removed by an edit or a recheck).
  useEffect(() => {
    if (activeId && !suggestion) setActive(null);
  }, [activeId, suggestion, setActive]);

  // Outside press or Escape closes the popover. Escape is handled at the
  // document level too, so it works even if focus has not landed in the card.
  useEffect(() => {
    if (!cardOpen || isMobile) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (refs.floating.current?.contains(target)) return;
      if (target.closest("[data-suggestion-id]")) return; // handled elsewhere
      setActive(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [cardOpen, isMobile, refs, setActive, close]);

  const doApply = useCallback(
    (replacement: string) => {
      if (!editor || !suggestion) return;
      applySuggestion(editor, suggestion, replacement);
      showToast("Applied");
      setActive(null);
    },
    [editor, suggestion, showToast, setActive],
  );

  const doDismiss = useCallback(() => {
    if (!suggestion) return;
    const id = suggestion.id;
    dismiss(id);
    showToast("Dismissed", { label: "Undo", run: () => undismiss(id) });
    close();
  }, [suggestion, dismiss, showToast, undismiss, close]);

  const doIgnore = useCallback(() => {
    if (!suggestion) return;
    ignoreRule(suggestion.ruleId);
    showToast("Rule ignored");
    close();
  }, [suggestion, ignoreRule, showToast, close]);

  const doAddToDictionary = useCallback(() => {
    if (!suggestion) return;
    addToDictionary(suggestion.original);
    showToast("Added to dictionary");
    close();
  }, [suggestion, addToDictionary, showToast, close]);

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!suggestion) return;
      const { replacements } = suggestion;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (replacements[0]) doApply(replacements[0]);
      } else if (event.key === "1" || event.key === "2" || event.key === "3") {
        const replacement = replacements[Number(event.key) - 1];
        if (replacement) {
          event.preventDefault();
          doApply(replacement);
        }
      } else if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        doDismiss();
      }
    },
    [suggestion, close, doApply, doDismiss],
  );

  if (!suggestion || !cardOpen) return null;

  const showAddToDictionary =
    suggestion.category === "correctness" &&
    suggestion.title === "Possible typo";

  const body = (
    <CardBody
      suggestion={suggestion}
      showAddToDictionary={showAddToDictionary}
      onApply={doApply}
      onDismiss={doDismiss}
      onIgnore={doIgnore}
      onAddToDictionary={doAddToDictionary}
    />
  );

  if (isMobile) {
    return (
      <Sheet open onClose={close} label="Suggestion">
        <div onKeyDown={onKeyDown}>{body}</div>
      </Sheet>
    );
  }

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className={styles.card}
        role="dialog"
        aria-label={`${suggestion.title} suggestion`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        {body}
      </div>
    </FloatingPortal>
  );
}
