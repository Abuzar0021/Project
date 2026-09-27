import { Kbd } from "@/components/ui/Kbd";
import styles from "./StatusBar.module.css";

interface StatusBarProps {
  words: number;
  minutes: number;
  save: string;
  paused?: boolean;
}

export function StatusBar({ words, minutes, save, paused }: StatusBarProps) {
  return (
    <div className={styles.status}>
      <span>
        {words.toLocaleString("en-US")} {words === 1 ? "word" : "words"}
      </span>
      <span>{minutes} min read</span>
      <span role="status">{save}</span>
      {paused ? (
        <span className={styles.paused}>Checking paused, retrying</span>
      ) : null}
      <span className={styles.hints}>
        <Kbd>J</Kbd> <Kbd>K</Kbd> move &nbsp; <Kbd>&crarr;</Kbd> accept &nbsp;{" "}
        <Kbd>S</Kbd> stet &nbsp; <Kbd>&#8984;K</Kbd> commands
      </span>
    </div>
  );
}
