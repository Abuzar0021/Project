/** Small dark label that follows the pointer. */

import styles from "./Tooltip.module.css";

/** Small dark label that follows the pointer. */
export function Tooltip({
  text,
  x,
  y,
}: {
  text: string;
  x: number;
  y: number;
}) {
  return (
    <div
      className={styles.tip}
      style={{ left: x + 12, top: y - 10 }}
      role="tooltip"
    >
      {text}
    </div>
  );
}
