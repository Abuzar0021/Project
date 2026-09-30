/**
 * Scene 1. Black screen, plain type. AI made writing faster, then the loop
 * of asking and pasting speeds up until it snaps off, and what is left is
 * the real problem: the writing stopped sounding like the person.
 */

import { gsap } from "gsap";
import type { Scene } from "../motion";
import { EASE, conceal, hidden, reveal, split } from "../motion";
import styles from "../Film.module.css";

const LOOP = ["Write.", "Ask AI.", "Generate.", "Rewrite.", "Copy.", "Edit."];

export function ProblemLayer() {
  return (
    <div className={`${styles.layer} ${styles.center}`} aria-hidden="true">
      <div className={styles.stack}>
        <p className={styles.title} data-f="p-faster">
          Writing with AI got faster.
        </p>
        <p className={styles.title} data-f="p-problem">
          But writing still has a problem.
        </p>
        <div className={styles.stack} data-f="loop">
          {[...LOOP, ...LOOP].map((word, i) => (
            <span key={i} className={styles.flash} data-f="loop-word">
              {word}
            </span>
          ))}
        </div>
        <div className={styles.pair}>
          <p
            className={`${styles.titleSmall} ${styles.quiet}`}
            data-f="p-along"
          >
            Somewhere along the way,
          </p>
          <p className={styles.title} data-f="p-yours">
            the writing stopped feeling like yours.
          </p>
        </div>
      </div>
    </div>
  );
}

export const problem: Scene = {
  id: "problem",
  title: "The problem",
  duration: 10.8,
  build(tl, { q, qa, beat }, t) {
    const faster = split(q("p-faster"));
    const problemWords = split(q("p-problem"));
    const yours = split(q("p-yours"));
    const loop = qa("loop-word");
    gsap.set([...faster, ...problemWords, ...yours, q("p-along")], hidden());
    gsap.set(loop, { autoAlpha: 0 });

    reveal(tl, faster, t + 0.3, { stagger: 0.07 });
    beat(tl, "open", t + 0.3);
    conceal(tl, q("p-faster"), t + 2.3);

    reveal(tl, problemWords, t + 2.7, { stagger: 0.07 });
    beat(tl, "problem", t + 2.7);
    conceal(tl, q("p-problem"), t + 4.5);

    // The loop: each word is on screen a little less than the last, and the
    // whole stack creeps toward the viewer, until it cuts to black.
    let at = t + 5.0;
    loop.forEach((word, i) => {
      const hold = 0.42 * Math.pow(0.84, i);
      tl.set(word, { autoAlpha: 1 }, at);
      tl.set(word, { autoAlpha: 0 }, at + hold);
      beat(tl, "tick", at);
      at += hold;
    });
    tl.fromTo(
      q("loop"),
      { scale: 0.94 },
      {
        scale: 1.22,
        duration: at - (t + 5.0),
        ease: "power2.in",
        immediateRender: false,
      },
      t + 5.0,
    );
    beat(tl, "cut", at);

    reveal(tl, q("p-along"), at + 0.5, { duration: 1.3 });
    reveal(tl, yours, at + 1.0, { stagger: 0.06, duration: 1.2 });
    conceal(tl, [q("p-along"), q("p-yours")], t + 10.0, {
      duration: 0.9,
      ease: EASE.move,
    });
  },
};
