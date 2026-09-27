import type { Category } from "@/types/suggestion";
import styles from "./Notes.module.css";

/** A 12px sample of the category's underline: solid, dotted or wavy. */
export function Swatch({ category }: { category: Category }) {
  if (category === "voice") {
    return (
      <svg
        className={styles.wave}
        width="12"
        height="4"
        viewBox="0 0 12 4"
        aria-hidden="true"
      >
        <path
          d="M0 2 Q1.5 0 3 2 T6 2 T9 2 T12 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    );
  }
  return (
    <span
      className={`${styles.swatch} ${styles[`sw-${category}`]}`}
      aria-hidden="true"
    />
  );
}
