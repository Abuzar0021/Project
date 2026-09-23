/**
 * CardBody: the shared contents of the suggestion card (DESIGN 8.2).
 * Used by both the desktop popover and the mobile bottom sheet. Shows the
 * category, the struck original with its replacements, a plain-language message,
 * and the actions. Replacement buttons apply that specific replacement; the
 * primary Apply button applies the first.
 */
"use client";

import type { Suggestion, Category } from "@/types/suggestion";
import { CATEGORY_LABELS } from "@/types/suggestion";
import { Button } from "@/components/ui/Button";
import styles from "./SuggestionCard.module.css";

const CATEGORY_COLORS: Record<Category, string> = {
  correctness: "var(--cat-correct)",
  clarity: "var(--cat-clarity)",
  tone: "var(--cat-tone)",
  style: "var(--cat-style)",
};

interface CardBodyProps {
  suggestion: Suggestion;
  showAddToDictionary: boolean;
  onApply: (replacement: string) => void;
  onDismiss: () => void;
  onIgnore: () => void;
  onAddToDictionary: () => void;
}

export function CardBody({
  suggestion,
  showAddToDictionary,
  onApply,
  onDismiss,
  onIgnore,
  onAddToDictionary,
}: CardBodyProps) {
  const { replacements } = suggestion;
  const primary = replacements[0];

  return (
    <div className={styles.body}>
      <div className={styles.header}>
        <span
          className={styles.dot}
          style={{ background: CATEGORY_COLORS[suggestion.category] }}
          aria-hidden="true"
        />
        <span className={styles.category}>
          {CATEGORY_LABELS[suggestion.category]}
        </span>
        <span className={styles.sep} aria-hidden="true">
          &middot;
        </span>
        <span className={styles.title}>{suggestion.title}</span>
      </div>

      {replacements.length > 0 ? (
        <div className={styles.replacements}>
          <del className={styles.original}>{suggestion.original}</del>
          <div className={styles.options}>
            {replacements.map((replacement, index) => (
              <button
                key={`${replacement}-${index}`}
                type="button"
                className={index === 0 ? styles.primaryRepl : styles.altRepl}
                onClick={() => onApply(replacement)}
              >
                {replacement}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className={styles.message} title={suggestion.message}>
        {suggestion.message}
      </p>

      <div className={styles.actions}>
        {primary ? (
          <Button variant="primary" onClick={() => onApply(primary)}>
            Apply
          </Button>
        ) : null}
        <Button onClick={onDismiss}>Dismiss</Button>
        <Button onClick={onIgnore}>Ignore this rule</Button>
        {showAddToDictionary ? (
          <Button onClick={onAddToDictionary}>Add to dictionary</Button>
        ) : null}
      </div>
    </div>
  );
}
