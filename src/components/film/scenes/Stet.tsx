/**
 * Scene 8. Saying no, once. The writer keeps a word Margin questioned, and
 * that choice is filed in Stet memory. Then a different draft opens with the
 * same word in it: the suggestion starts to form, finds the kept word in
 * memory, and dissolves before it bothers anyone.
 */

import { gsap } from "gsap";
import type { Scene } from "../motion";
import {
  EASE,
  conceal,
  hidden,
  hiddenUi,
  press,
  reveal,
  split,
} from "../motion";
import { keyPress, noteCount, openNote, token } from "./shared";
import styles from "../Film.module.css";

export function StetLayer() {
  return (
    <>
      <div className={`${styles.layer} ${styles.center}`} aria-hidden="true">
        <div className={styles.pair}>
          <p className={styles.title} data-f="s-once">
            Say no once.
          </p>
          <p className={`${styles.title} ${styles.accent}`} data-f="s-heard">
            Stay heard.
          </p>
        </div>
      </div>
      <div className={styles.layer} aria-hidden="true">
        <div className={styles.lower}>
          <div data-f="s-memory">
            <p className={styles.eyebrow}>Stet memory</p>
            <p className={styles.caption}>
              What you keep stays kept, in every draft.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export const stet: Scene = {
  id: "stet",
  title: "Stet memory",
  duration: 10.8,
  build(tl, ctx, t) {
    const { q, camera, inApp, beat } = ctx;
    const once = split(q("s-once"));
    const heard = split(q("s-heard"));
    const others = (["j", "k", "enter", "cmdk"] as const).map((id) =>
      q(`key-${id}`),
    );
    gsap.set([...once, ...heard, q("s-memory")], hidden());
    gsap.set([q("memory"), q("memo")], hiddenUi());
    gsap.set(q("crumb-b"), { autoAlpha: 0, y: 8 });
    gsap.set(q("page-b"), { xPercent: 100 });
    gsap.set(q("ghost-note"), {
      ...hiddenUi(),
      top: inApp(q("ghost-mark")).y - inApp(q("ghost-note")).y - 12,
    });
    gsap.set(q("ghost-mark"), { textDecorationColor: "rgba(0, 0, 0, 0)" });

    // The memory row starts where the memo is and files itself in the panel.
    const memo = inApp(q("memo"));
    const row = inApp(q("memory-row"));
    gsap.set(q("memory-row"), {
      x: memo.x - row.x,
      y: memo.y - row.y,
      autoAlpha: 0,
    });

    camera.to(
      tl,
      { els: [q("mark-plainer"), q("slot-plainer")], fill: 0.8 },
      t,
      { duration: 1.8 },
    );
    openNote(tl, ctx, "plainer", t + 0.8);
    tl.set(others, { display: "none" }, t + 0.7);
    reveal(tl, q("key-s"), t + 0.8, { duration: 0.6 });

    keyPress(tl, ctx, "s", t + 2.0);
    press(tl, q("stet-plainer"), t + 2.0);
    tl.to(
      q("mark-plainer"),
      {
        textDecorationColor: "rgba(0, 0, 0, 0)",
        backgroundColor: "rgba(0, 0, 0, 0)",
        duration: 0.4,
      },
      t + 2.2,
    );
    conceal(tl, q("slot-plainer"), t + 2.2, { x: 10, y: 0 });
    reveal(tl, q("memo"), t + 2.5, { duration: 0.6 });
    noteCount(tl, ctx, 1, 0, t + 2.2);
    beat(tl, "stet", t + 2.0);
    conceal(tl, q("key-s"), t + 3.0);

    camera.to(tl, {}, t + 3.1, { duration: 1.6 });
    reveal(tl, q("memory"), t + 3.5, { duration: 0.6 });
    tl.to(q("memory-row"), { autoAlpha: 1, duration: 0.2 }, t + 3.8);
    tl.to(
      q("memory-row"),
      { x: 0, y: 0, duration: 1.0, ease: EASE.move },
      t + 3.8,
    );
    beat(tl, "file", t + 4.8);

    tl.to(q("dim"), { opacity: 0.84, duration: 0.8 }, t + 4.8);
    reveal(tl, once, t + 5.0, { stagger: 0.07 });
    reveal(tl, heard, t + 5.8, { stagger: 0.07 });
    beat(tl, "line", t + 5.8);
    conceal(tl, [q("s-once"), q("s-heard")], t + 7.1);
    tl.to(q("dim"), { opacity: 0, duration: 0.8 }, t + 7.2);

    // Another draft, the same word.
    conceal(tl, q("memo"), t + 7.4, { y: 0, duration: 0.3 });
    tl.to(q("crumb-a"), { autoAlpha: 0, y: -8, duration: 0.4 }, t + 7.5);
    tl.to(q("crumb-b"), { autoAlpha: 1, y: 0, duration: 0.5 }, t + 7.7);
    tl.to(
      q("page-a"),
      { xPercent: -30, autoAlpha: 0, duration: 1.0, ease: EASE.move },
      t + 7.5,
    );
    tl.to(
      q("page-b"),
      { xPercent: 0, duration: 1.0, ease: EASE.move },
      t + 7.5,
    );
    beat(tl, "switch", t + 7.5);
    camera.to(
      tl,
      { els: [q("ghost-mark"), q("ghost-note"), q("memory")], fill: 0.86 },
      t + 7.8,
      {
        duration: 1.6,
      },
    );

    // The suggestion begins, checks memory, and lets go.
    tl.to(
      q("ghost-mark"),
      { textDecorationColor: token(ctx, "--clar"), duration: 0.3 },
      t + 9.1,
    );
    tl.to(
      q("ghost-note"),
      { autoAlpha: 0.9, y: 0, filter: "blur(0px)", duration: 0.4 },
      t + 9.2,
    );
    tl.to(
      q("memory-row"),
      { backgroundColor: token(ctx, "--ac-soft"), duration: 0.2 },
      t + 9.6,
    );
    tl.to(
      q("memory-row"),
      { backgroundColor: token(ctx, "--hover"), duration: 0.8 },
      t + 10.0,
    );
    beat(tl, "remembered", t + 9.6);
    tl.to(
      q("ghost-mark"),
      { textDecorationColor: "rgba(0, 0, 0, 0)", duration: 0.5 },
      t + 9.8,
    );
    conceal(tl, q("ghost-note"), t + 9.8, { duration: 0.7 });
    beat(tl, "dissolve", t + 9.8);

    reveal(tl, q("s-memory"), t + 9.1);
    conceal(tl, q("s-memory"), t + 10.4);
  },
};
