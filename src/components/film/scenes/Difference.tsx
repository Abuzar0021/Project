/**
 * Scene 4. The whole idea in one edit. The camera goes in close on a passive
 * sentence and its note, the writer accepts, and the sentence changes in
 * place. Then the room goes dark around the three lines that explain what
 * just happened: Margin showed it, the writer decided it.
 */

import { gsap } from "gsap";
import type { Scene } from "../motion";
import { EASE, conceal, hidden, reveal, split } from "../motion";
import { acceptNote, openNote } from "./shared";
import styles from "../Film.module.css";

export function DifferenceLayer() {
  return (
    <div className={`${styles.layer} ${styles.center}`} aria-hidden="true">
      <div className={styles.stack}>
        <p className={styles.title} data-f="d-replace">
          Margin doesn&rsquo;t replace your writing.
        </p>
        <div className={styles.pair} data-f="d-pair">
          <p className={`${styles.titleSmall} ${styles.quiet}`} data-f="d-see">
            It helps you see it.
          </p>
          <p className={styles.title} data-f="d-decide">
            You decide what stays.
          </p>
        </div>
      </div>
    </div>
  );
}

export const difference: Scene = {
  id: "difference",
  title: "The difference",
  duration: 9.8,
  build(tl, ctx, t) {
    const { q, camera, beat } = ctx;
    const replace = split(q("d-replace"));
    const decide = split(q("d-decide"));
    gsap.set([...replace, ...decide, q("d-see")], hidden());

    camera.to(
      tl,
      { els: [q("mark-passive"), q("slot-passive")], fill: 0.8 },
      t,
      {
        duration: 1.9,
      },
    );
    beat(tl, "push-in", t);
    openNote(tl, ctx, "passive", t + 1.3);
    beat(tl, "focus", t + 1.3);
    acceptNote(tl, ctx, "passive", t + 2.9, [5, 4], {
      out: q("old-passive"),
      in: q("new-passive"),
    });

    // Step back and let the room go dark behind the words.
    camera.to(tl, { zoom: 0.94 }, t + 4.9, { duration: 2.4 });
    tl.to(
      q("dim"),
      { opacity: 0.84, duration: 1.1, ease: "power1.inOut" },
      t + 5.1,
    );
    reveal(tl, replace, t + 5.5, { stagger: 0.06 });
    beat(tl, "line", t + 5.5);
    conceal(tl, q("d-replace"), t + 7.2);
    reveal(tl, q("d-see"), t + 7.5);
    reveal(tl, decide, t + 8.2, { stagger: 0.07 });
    beat(tl, "line", t + 8.2);
    conceal(tl, q("d-pair"), t + 9.2, { duration: 0.7, ease: EASE.move });
    tl.to(
      q("dim"),
      { opacity: 0, duration: 0.9, ease: "power1.inOut" },
      t + 9.3,
    );
  },
};
