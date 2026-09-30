/**
 * Scene 9. A fast cut. The key caps come to the middle of the screen and
 * fire in rhythm, and on every press the camera cuts to another corner of
 * the app, the way working without a mouse feels: quick and exact.
 */

import { gsap } from "gsap";
import type { Framing, Scene } from "../motion";
import { conceal, hidden, offsetWithin, reveal, split } from "../motion";
import { KEYS, keyPress, type KeyId } from "./shared";
import styles from "../Film.module.css";

const SEQUENCE: KeyId[] = ["j", "j", "k", "enter", "s", "cmdk", "j", "enter"];

export function KeyboardLayer() {
  return (
    <div
      className={`${styles.layer} ${styles.center} ${styles.raised}`}
      aria-hidden="true"
    >
      <div className={styles.pair}>
        <p className={styles.title} data-f="k-built">
          Built for the keyboard.
        </p>
        <p className={`${styles.titleSmall} ${styles.quiet}`} data-f="k-hands">
          Because your hands are already on the page.
        </p>
      </div>
    </div>
  );
}

export const keyboard: Scene = {
  id: "keyboard",
  title: "Keyboard first",
  duration: 5.2,
  build(tl, ctx, t) {
    const { q, camera, compact } = ctx;
    const built = split(q("k-built"));
    const keys = q("keys");
    const all = KEYS.map((key) => q(`key-${key.id}`));
    gsap.set([...built, q("k-hands")], hidden());

    const stage = q("stage");
    const box = offsetWithin(keys, stage);
    const lift =
      stage.clientHeight / 2 + (compact ? 150 : 110) - (box.y + box.h / 2);

    const cuts: Framing[] = [
      { els: [q("chip-rhythm"), q("chip-notes")], fill: 0.7 },
      { els: [q("memory")], fill: 0.6 },
      { els: [q("crumb-b")], fill: 0.7 },
      { els: [q("status")], zoom: 1.8, dx: 240 },
      { els: [q("page-b")], fill: 0.9 },
    ];

    tl.set(all, { display: "block" }, t);
    // Shallow focus: the app blurs behind the keys so only the type is sharp.
    // Phones skip the blur, which is costly there, and dim harder instead.
    tl.to(q("dim"), { opacity: compact ? 0.9 : 0.7, duration: 0.6 }, t);
    tl.to(
      q("rig"),
      { filter: compact ? "blur(0px)" : "blur(6px)", duration: 0.6 },
      t,
    );
    tl.to(
      keys,
      { y: lift, scale: compact ? 1 : 1.25, duration: 0.01 },
      t + 0.1,
    );
    reveal(tl, all, t + 0.2, { stagger: 0.05, duration: 0.6 });
    reveal(tl, built, t + 0.3, { stagger: 0.06 });

    SEQUENCE.forEach((id, i) => {
      const at = t + 1.1 + i * 0.26;
      keyPress(tl, ctx, id, at);
      camera.cut(tl, cuts[i % cuts.length] ?? {}, at);
    });

    reveal(tl, q("k-hands"), t + 3.2);
    camera.to(tl, {}, t + 3.3, { duration: 2 });
    conceal(tl, [q("k-built"), q("k-hands")], t + 4.8);
    conceal(tl, all, t + 4.8, { stagger: 0.03 });
    tl.to(q("rig"), { filter: "blur(0px)", duration: 0.8 }, t + 4.9);
  },
};
