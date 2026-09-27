import Link from "next/link";
import { DemoFrame } from "./DemoFrame";
import site from "./site.module.css";
import styles from "./Landing.module.css";

export function Hero() {
  return (
    <section className={`${site.wrap} ${styles.hero}`}>
      <h1 className={site.d1}>
        The writing editor
        <br className={styles.desktopBreak} /> that keeps your voice
      </h1>
      <div className={styles.heroRow}>
        <p className={site.lead}>
          Margin checks spelling, clarity and tone, then leaves short notes
          beside your text. It learns how you write, so its edits sound like
          you.
        </p>
        <p className={styles.new}>
          <b>New</b>
          <Link href="/#stet-memory">Stet memory &rarr;</Link>
        </p>
      </div>
      <DemoFrame />
    </section>
  );
}
