/** Top bar with the breadcrumb on the left and tool chips on the right. */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { MenuIcon } from "./icons";
import styles from "./TopBar.module.css";

export function TopBar({
  crumbs,
  tools,
  onMenu,
}: {
  crumbs: ReactNode;
  tools?: ReactNode;
  onMenu?: () => void;
}) {
  return (
    <div className={styles.top}>
      {onMenu ? (
        <button
          type="button"
          className={styles.menu}
          onClick={onMenu}
          aria-label="Open sidebar"
        >
          <MenuIcon />
        </button>
      ) : null}
      <div className={styles.crumb}>{crumbs}</div>
      {tools ? <div className={styles.tools}>{tools}</div> : null}
    </div>
  );
}

export function Chip({
  on,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${on ? styles.on : ""} ${className ?? ""}`}
      aria-pressed={on}
      {...rest}
    />
  );
}

export function ChipLabel({ children }: { children: ReactNode }) {
  return <span className={styles.label}>{children}</span>;
}

export function ChipNumber({ children }: { children: ReactNode }) {
  return <span className={styles.num}>{children}</span>;
}
