/**
 * RailNote: one margin note, compact by default and expanded when active.
 * Compact shows the category dot and title (and a replacement preview). Active
 * shows the replacements and inline Apply / Dismiss. On tablet it collapses to a
 * single colored dot that opens the card. Hovering reports the id up so the mark
 * and leader line can highlight.
 */
"use client";

import type { Suggestion } from "@/types/suggestion";
import { CATEGORY_LABELS } from "@/types/suggestion";
import { CATEGORY_COLOR_VAR } from "@/lib/suggestions/category-colors";
import { Button } from "@/components/ui/Button";
import type { SuggestionActions } from "@/components/card/use-suggestion-actions";
import styles from "./MarginRail.module.css";

interface RailNoteProps {
  suggestion: Suggestion;
  top: number;
  active: boolean;
  hovered: boolean;
  dotMode: boolean;
  registerRef: (id: string, el: HTMLElement | null) => void;
  onActivate: () => void;
  onHover: (id: string | null) => void;
  actions: SuggestionActions;
}

export function RailNote({
  suggestion,
  top,
  active,
  hovered,
  dotMode,
  registerRef,
  onActivate,
  onHover,
  actions,
}: RailNoteProps) {
  const color = CATEGORY_COLOR_VAR[suggestion.category];
  const primary = suggestion.replacements[0];

  const hoverIn = () => onHover(suggestion.id);
  const hoverOut = () => onHover(null);

  if (dotMode) {
    return (
      <li
        ref={(el) => registerRef(suggestion.id, el)}
        className={styles.dotItem}
        style={{ top }}
        role="listitem"
      >
        <button
          type="button"
          className={`${styles.dotButton} ${hovered ? styles.dotHovered : ""}`}
          style={{ background: color }}
          aria-label={`${CATEGORY_LABELS[suggestion.category]}: ${suggestion.title}`}
          onClick={onActivate}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
          onFocus={hoverIn}
          onBlur={hoverOut}
        />
      </li>
    );
  }

  return (
    <li
      ref={(el) => registerRef(suggestion.id, el)}
      className={`${styles.item} ${active ? styles.itemActive : ""} ${hovered ? styles.itemHovered : ""}`}
      style={{ top }}
      role="listitem"
    >
      <button
        type="button"
        className={styles.noteButton}
        onClick={onActivate}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
        onFocus={hoverIn}
        onBlur={hoverOut}
      >
        <span className={styles.noteHeader}>
          <span
            className={styles.dot}
            style={{ background: color }}
            aria-hidden="true"
          />
          <span className={styles.noteTitle}>{suggestion.title}</span>
        </span>
        {!active && primary ? (
          <span className={styles.preview}>
            <del className={styles.original}>{suggestion.original}</del>
            <span className={styles.previewRepl}>{primary}</span>
          </span>
        ) : null}
      </button>

      {active ? (
        <div className={styles.expanded}>
          {suggestion.replacements.length > 0 ? (
            <div className={styles.options}>
              <del className={styles.original}>{suggestion.original}</del>
              {suggestion.replacements.map((replacement, index) => (
                <button
                  key={`${replacement}-${index}`}
                  type="button"
                  className={index === 0 ? styles.primaryRepl : styles.altRepl}
                  onClick={() => actions.apply(suggestion, replacement)}
                >
                  {replacement}
                </button>
              ))}
            </div>
          ) : null}
          <p className={styles.message} title={suggestion.message}>
            {suggestion.message}
          </p>
          <div className={styles.actions}>
            {primary ? (
              <Button
                variant="primary"
                onClick={() => actions.apply(suggestion, primary)}
              >
                Apply
              </Button>
            ) : null}
            <Button onClick={() => actions.dismiss(suggestion)}>Dismiss</Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
