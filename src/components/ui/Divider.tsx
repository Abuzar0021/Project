import styles from "./Divider.module.css";

export function Divider({ label = "or" }: { label?: string }) {
  return (
    <div className={styles.divider} role="separator">
      {label}
    </div>
  );
}
