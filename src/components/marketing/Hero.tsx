/** Landing hero: dithered mark, headline, lead, and the live product frame. */

import Link from "next/link";
import { DemoFrame } from "./DemoFrame";
import { DitheredLogo } from "./DitheredLogo";
import { TextMorph } from "./TextMorph";
import site from "./site.module.css";
import styles from "./Landing.module.css";

/** What Margin looks after, cycled in the headline. "voice" leads and is what screen readers hear. */
const KEPT = ["voice", "tone", "style"];

export function Hero() {
  return (
    <section className={`${site.wrap} ${styles.hero}`}>
      <DitheredLogo
        imageSrc="/margin-mark.svg"
        className={styles.heroMark}
        gridSize={64}
        scale={0.62}
        dotScale={0.7}
        cornerRadius={0}
        blur={0}
      />
      <h1 className={site.d1}>
        The writing editor
        <br className={styles.desktopBreak} /> that keeps your{" "}
        <TextMorph words={KEPT} interval={2600} morphDuration={680} />
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
