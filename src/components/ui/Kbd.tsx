/** Keyboard key label, styled for the site, the app, or inside a button. */

import styles from "./Kbd.module.css";

type Variant = "site" | "app" | "inline";

export function Kbd({
  children,
  variant = "app",
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  return <kbd className={`${styles.kbd} ${styles[variant]}`}>{children}</kbd>;
}
