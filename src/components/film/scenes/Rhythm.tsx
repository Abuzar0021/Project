/**
 * Scene 6. The shape of the prose. A bar grows in the gutter for every
 * sentence, sized by its length, and the one that runs on turns amber. The
 * camera travels along that sentence so the viewer feels how long it is.
 */

import { gsap } from "gsap";
import type { Scene } from "../motion";
import { EASE, conceal, hidden, hiddenUi, reveal } from "../motion";
import { token } from "./shared";
import styles from "../Film.module.css";

export function RhythmLayer() {
  return (
    <div className={styles.layer} aria-hidden="true">
      <div className={styles.lower}>
        <p className={styles.caption} data-f="r-rhythm">
          Good writing has a rhythm.
        </p>
        <p className={styles.caption} data-f="r-breaks">
          Margin shows you where it runs long.
        </p>
      </div>
    </div>
  );
}

export const rhythm: Scene = {
  id: "rhythm",
  title: "Sentence rhythm",
  duration: 7.2,
  build(tl, ctx, t) {
    const { q, qa, camera, inApp, beat } = ctx;
    const bars = [...qa("bar"), ...qa("bar-long")].sort(
      (a, b) => a.offsetTop - b.offsetTop,
    );
    const long = q("bar-long");
    const longSentence = qa("sentence")[Number(long.dataset.index)] ?? long;
    gsap.set(bars, { scaleX: 0 });
    gsap.set([q("r-rhythm"), q("r-breaks")], hidden());

    // The editor labels a bar with a hover tooltip; it opens under the bar.
    const at = inApp(long);
    gsap.set(q("tip"), { ...hiddenUi(), left: at.x + 4, top: at.y + 14 });

    camera.to(tl, { els: [...bars, qa("para")[1] ?? long], fill: 0.86 }, t, {
      duration: 1.8,
    });
    tl.to(
      bars,
      { scaleX: 1, duration: 0.6, stagger: 0.08, ease: EASE.land },
      t + 0.6,
    );
    beat(tl, "bars", t + 0.6);

    tl.to(
      long,
      { backgroundColor: token(ctx, "--warn"), duration: 0.3 },
      t + 1.8,
    );
    tl.to(
      longSentence,
      { backgroundColor: token(ctx, "--ac-soft"), duration: 0.4 },
      t + 1.8,
    );
    reveal(tl, q("tip"), t + 1.9, { duration: 0.5 });
    beat(tl, "long", t + 1.8);

    // Travel the length of the sentence, start to end.
    camera.to(tl, { els: [long, longSentence], fill: 1, dx: -50 }, t + 2.3, {
      duration: 1.4,
    });
    camera.to(tl, { els: [long, longSentence], fill: 1, dx: 50 }, t + 3.7, {
      duration: 2.4,
      ease: "sine.inOut",
    });

    reveal(tl, q("r-rhythm"), t + 2.4);
    conceal(tl, q("r-rhythm"), t + 4.2);
    reveal(tl, q("r-breaks"), t + 4.5);
    conceal(tl, q("r-breaks"), t + 6.6);
    conceal(tl, q("tip"), t + 6.4, { y: 0, duration: 0.3 });
    tl.to(
      longSentence,
      { backgroundColor: "rgba(0, 0, 0, 0)", duration: 0.5 },
      t + 6.4,
    );
  },
};
