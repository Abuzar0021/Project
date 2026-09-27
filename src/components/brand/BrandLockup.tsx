/**
 * BrandLockup: the flat mark with the "Margin" wordmark to its right (DESIGN
 * 8.7). Used in the editor's top bar and the marketing footer. No tagline, and
 * never the dithered mark; that appears only once, in the marketing hero.
 */
import { LogoMark } from "./LogoMark";
import styles from "./BrandLockup.module.css";

export function BrandLockup({ className }: { className?: string }) {
  return (
    <span
      className={className ? `${styles.lockup} ${className}` : styles.lockup}
    >
      <LogoMark size={20} className={styles.mark} />
      <span className={styles.word}>Margin</span>
    </span>
  );
}
