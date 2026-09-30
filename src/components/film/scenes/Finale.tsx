/**
 * Scene 12. The shapes fill back in with dots, the logo ripples once more,
 * and the film hands over to the one thing left to do: start writing.
 */

import { gsap } from "gsap";
import { ButtonLink } from "@/components/ui/Button";
import type { Scene } from "../motion";
import { hidden, reveal, split } from "../motion";
import styles from "../Film.module.css";

export function FinaleLayer() {
  return (
    <div className={styles.word} data-f="word-b">
      <p className={styles.wordmark} data-f="wordmark-b" aria-hidden="true">
        Margin
      </p>
      <p className={styles.tagline} data-f="tagline-b">
        The writing editor that keeps your voice.
      </p>
      <div className={styles.cta} data-f="cta">
        <ButtonLink href="/signup" variant="primary">
          Write your next draft in Margin
        </ButtonLink>
        <ButtonLink href="/" variant="outline">
          Explore Margin
        </ButtonLink>
      </div>
    </div>
  );
}

export const finale: Scene = {
  id: "finale",
  title: "Margin",
  duration: 5,
  build(tl, { q, logo, beat }, t) {
    const letters = split(q("wordmark-b"), "chars");
    gsap.set([...letters, q("tagline-b"), q("cta")], hidden());

    tl.to(q("logo"), { autoAlpha: 1, duration: 0.9 }, t);
    tl.to(
      [q("shape-bar"), q("shape-dot")],
      { autoAlpha: 0, duration: 0.9 },
      t + 0.2,
    );
    tl.call(() => logo.current?.ripple(0.5, 0.5), [], t + 0.4);
    beat(tl, "logo", t + 0.2);
    reveal(tl, letters, t + 1.0, { stagger: 0.035 });
    reveal(tl, q("tagline-b"), t + 1.6);
    reveal(tl, q("cta"), t + 2.3);
    beat(tl, "end", t + 2.3);
  },
};
