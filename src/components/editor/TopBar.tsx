/**
 * TopBar: the app chrome above the writing sheet (DESIGN.md 7 and 8.6).
 * Holds the wordmark, the editable document title with a small menu, the
 * category filter chips, the live word count, a status slot, the score button,
 * the theme toggle, and the keyboard-shortcuts link. The chips, score button,
 * and shortcuts link are intentionally inert this phase; they gain behavior in
 * later phases. All shared state comes from the editor-ui store.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorUI } from "@/store/editor-ui";
import { CATEGORIES, CATEGORY_LABELS } from "@/types/suggestion";
import type { CategoryFilter } from "@/types/suggestion";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { ScorePanel } from "@/components/score/ScorePanel";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./TopBar.module.css";

const CATEGORY_COLORS: Record<(typeof CATEGORIES)[number], string> = {
  correctness: "var(--cat-correct)",
  clarity: "var(--cat-clarity)",
  tone: "var(--cat-tone)",
  style: "var(--cat-style)",
};

interface TopBarProps {
  onNewDraft: () => void;
}

export function TopBar({ onNewDraft }: TopBarProps) {
  const title = useEditorUI((s) => s.title);
  const setTitle = useEditorUI((s) => s.setTitle);
  const filter = useEditorUI((s) => s.filter);
  const setFilter = useEditorUI((s) => s.setFilter);
  const wordCount = useEditorUI((s) => s.wordCount);

  const chips: { key: CategoryFilter; label: string; dot?: string }[] = [
    { key: "all", label: "All" },
    ...CATEGORIES.map((c) => ({
      key: c,
      label: CATEGORY_LABELS[c],
      dot: CATEGORY_COLORS[c],
    })),
  ];

  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <span className={styles.wordmark}>Margin</span>
        <TitleMenu title={title} setTitle={setTitle} onNewDraft={onNewDraft} />
      </div>

      <nav className={styles.chips} aria-label="Filter suggestions by category">
        {chips.map((chip) => (
          <Chip
            key={chip.key}
            label={chip.label}
            dotColor={chip.dot}
            active={filter === chip.key}
            onClick={() => setFilter(chip.key)}
          />
        ))}
      </nav>

      <div className={styles.right}>
        <span className={styles.wordCount}>
          {wordCount.toLocaleString("en-US")} words
        </span>
        {/* Status slot: the StatusIndicator lands here once checking exists. */}
        <span className={styles.statusSlot} aria-live="polite" />
        <ScorePanel />
        <ThemeToggle />
        <Button aria-label="Keyboard shortcuts">Shortcuts</Button>
      </div>
    </header>
  );
}

/** Editable title with a small menu offering "New draft". */
function TitleMenu({
  title,
  setTitle,
  onNewDraft,
}: {
  title: string;
  setTitle: (t: string) => void;
  onNewDraft: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.titleWrap} ref={wrapRef}>
      <input
        className={styles.title}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Document title"
        spellCheck={false}
      />
      <button
        type="button"
        className={styles.titleMenuButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Document menu"
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronIcon />
      </button>
      {open ? (
        <div className={styles.menu} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              onNewDraft();
              setOpen(false);
            }}
          >
            New draft
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M3.5 5.5 7 9l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
