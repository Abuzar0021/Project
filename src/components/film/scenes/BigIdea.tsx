/**
 * Scene 11. The argument in six words, then the product folds back into the
 * mark it came from: the page edge becomes the bar again, the kept word in
 * Stet memory becomes the circle. The film ends where the logo began.
 */

import { gsap } from "gsap";
import type { Scene } from "../motion";
import { EASE, conceal, hidden, reveal, split } from "../motion";
import { markShapes, over } from "./Reframe";
import { token } from "./shared";
import styles from "../Film.module.css";

export function BigIdeaLayer() {
  return (
    <div className={`${styles.layer} ${styles.center}`} aria-hidden="true">
      <div className={styles.stack}>
        <div className={styles.pair} data-f="b-pair">
          <p
            className={`${styles.titleSmall} ${styles.quiet}`}
            data-f="b-write"
          >
            AI can write.
          </p>
          <p className={styles.title} data-f="b-decide">
            Margin helps you decide.
          </p>
        </div>
        <p className={styles.flash} data-f="b-pen">
          Keep the pen.
        </p>
      </div>
    </div>
  );
}

export const bigIdea: Scene = {
  id: "idea",
  title: "Keep the pen",
  duration: 7.6,
  build(tl, ctx, t) {
    const { q, camera, beat } = ctx;
    const decide = split(q("b-decide"));
    const pen = split(q("b-pen"), "chars");
    gsap.set([q("b-write"), ...decide, ...pen], hidden());

    reveal(tl, q("b-write"), t + 0.2);
    reveal(tl, decide, t + 1.2, { stagger: 0.07 });
    beat(tl, "line", t + 1.2);
    conceal(tl, q("b-pair"), t + 3.0);

    // The page comes back up behind the last line, then folds away.
    const close = { zoom: 1.04 };
    tl.to(
      q("dim"),
      { opacity: 0.6, duration: 1.4, ease: "power1.inOut" },
      t + 3.3,
    );
    camera.to(tl, close, t + 3.2, { duration: 3, ease: "sine.inOut" });
    reveal(tl, pen, t + 3.5, { stagger: 0.05, duration: 1.3 });
    beat(tl, "pen", t + 3.5);
    conceal(tl, q("b-pen"), t + 5.6, { duration: 0.5 });

    const logo = markShapes(ctx);
    const edge = camera.project(q("doc-b"), close);
    const row = camera.project(q("memory-row"), close);
    tl.set(
      q("shape-bar"),
      over({ x: edge.x - 16, y: edge.y, w: 2, h: edge.h * 0.7 }, 1),
      t + 5.9,
    );
    // The kept word leaves as a grey card and arrives as the ink circle.
    tl.set(
      q("shape-dot"),
      { ...over(row, 6), backgroundColor: token(ctx, "--rule") },
      t + 5.9,
    );
    tl.to(
      [q("shape-bar"), q("shape-dot")],
      { autoAlpha: 1, duration: 0.4 },
      t + 5.9,
    );
    tl.to(q("dim"), { opacity: 1, duration: 0.7 }, t + 6.0);
    tl.to(
      q("shape-bar"),
      { ...logo.bar, duration: 1.3, ease: EASE.move },
      t + 6.2,
    );
    tl.to(
      q("shape-dot"),
      {
        ...logo.dot,
        backgroundColor: getComputedStyle(q("stage")).color,
        duration: 1.3,
        ease: EASE.move,
      },
      t + 6.3,
    );
    beat(tl, "fold", t + 6.2);
  },
};
