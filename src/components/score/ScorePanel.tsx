/**
 * ScorePanel: the score button in the top bar plus the panel it opens (DESIGN
 * 8.5). The button shows the live overall number. The panel is an anchored
 * dropdown on desktop and a full sheet on mobile, showing per-category counts as
 * bars, the readability metrics, the tone label, and the honest disclaimer.
 * Clicking a category row filters the editor to that category.
 */
"use client";

import { useEffect, useState } from "react";
import {
  useFloating,
  offset,
  flip,
  shift,
  FloatingPortal,
} from "@floating-ui/react";
import { CATEGORIES, CATEGORY_LABELS } from "@/types/suggestion";
import type { Category } from "@/types/suggestion";
import { CATEGORY_COLOR_VAR } from "@/lib/suggestions/category-colors";
import { useEditorUI } from "@/store/editor-ui";
import { useScore } from "./use-score";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import styles from "./ScorePanel.module.css";

export function ScorePanel() {
  const [open, setOpen] = useState(false);
  const score = useScore();
  const setFilter = useEditorUI((s) => s.setFilter);

  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-end",
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
  });

  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (refs.floating.current?.contains(target)) return;
      if (refs.reference.current instanceof HTMLElement) {
        if (refs.reference.current.contains(target)) return;
      }
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, refs]);

  const onPickCategory = (category: Category) => {
    setFilter(category);
    setOpen(false);
  };

  const panel = <ScoreBody score={score} onPickCategory={onPickCategory} />;

  return (
    <>
      <Button
        ref={refs.setReference}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Score ${score.overall}. Open score panel`}
      >
        <span className={styles.scoreLabel}>Score</span>
        <span className={styles.scoreNumber}>{score.overall}</span>
      </Button>

      {open && isMobile ? (
        <Sheet open onClose={() => setOpen(false)} label="Score">
          {panel}
        </Sheet>
      ) : null}

      {open && !isMobile ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={styles.panel}
            role="dialog"
            aria-label="Score"
          >
            {panel}
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return mobile;
}

function ScoreBody({
  score,
  onPickCategory,
}: {
  score: ReturnType<typeof useScore>;
  onPickCategory: (category: Category) => void;
}) {
  const maxCount = Math.max(1, ...CATEGORIES.map((c) => score.counts[c]));

  return (
    <div className={styles.body}>
      <div className={styles.overall}>
        <span className={styles.overallNumber}>{score.overall}</span>
        <span className={styles.overallLabel}>Overall score</span>
      </div>

      <div className={styles.rows}>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={styles.row}
            onClick={() => onPickCategory(category)}
          >
            <span className={styles.rowLabel}>{CATEGORY_LABELS[category]}</span>
            <span className={styles.bar} aria-hidden="true">
              <span
                className={styles.barFill}
                style={{
                  width: `${(score.counts[category] / maxCount) * 100}%`,
                  background: CATEGORY_COLOR_VAR[category],
                }}
              />
            </span>
            <span className={styles.rowCount}>{score.counts[category]}</span>
          </button>
        ))}
      </div>

      <dl className={styles.metrics}>
        <div className={styles.metric}>
          <dt>Reading level</dt>
          <dd>Grade {score.readingGrade}</dd>
        </div>
        <div className={styles.metric}>
          <dt>Avg sentence</dt>
          <dd>{score.avgSentenceLength} words</dd>
        </div>
        <div className={styles.metric}>
          <dt>Passive voice</dt>
          <dd>
            {score.passiveCount}{" "}
            {score.passiveCount === 1 ? "sentence" : "sentences"}
          </dd>
        </div>
        <div className={styles.metric}>
          <dt>Tone reads as</dt>
          <dd>{score.toneLabel}</dd>
        </div>
      </dl>

      <p className={styles.disclaimer}>
        Scores are estimates based on the issues found, not a grade of your
        writing.
      </p>
    </div>
  );
}
