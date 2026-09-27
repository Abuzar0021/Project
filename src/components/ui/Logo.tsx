import styles from "./Logo.module.css";

export function LogoMark({ size = 20 }: { size?: 16 | 20 | 32 }) {
  return (
    <svg
      className={styles.mark}
      width={size}
      height={size}
      viewBox="0 0 240 240"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="60" y="40" width="26" height="160" rx="6" />
      <circle cx="168" cy="88" r="40" />
    </svg>
  );
}

export function Logo({ size = 20 }: { size?: 16 | 20 | 32 }) {
  return (
    <span className={styles.logo}>
      <LogoMark size={size} />
      <span className={styles.word}>Margin</span>
    </span>
  );
}
