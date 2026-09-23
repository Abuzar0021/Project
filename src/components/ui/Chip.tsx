/**
 * Chip: a toggle used for the category filter row in the top bar.
 * Each category chip carries a small dot in its category color so the filter
 * doubles as a legend. Selection is a pressed state, announced with
 * aria-pressed. Filtering behavior is wired up in Phase 3; here the chips only
 * track which one is active.
 */
"use client";

import styles from "./Chip.module.css";

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  /** CSS color token for the leading dot, omitted for the "All" chip. */
  dotColor?: string;
}

export function Chip({ label, active, onClick, dotColor }: ChipProps) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.active : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {dotColor ? (
        <span
          className={styles.dot}
          style={{ background: dotColor }}
          aria-hidden="true"
        />
      ) : null}
      {label}
    </button>
  );
}
