/**
 * Scene 5. How it feels to work through a draft: the notes sit beside the
 * lines they are about, and the keyboard walks between them. J and K move,
 * Enter accepts, and the command menu is one chord away.
 */

import { gsap } from "gsap";
import type { Scene } from "../motion";
import { conceal, hidden, hiddenUi, reveal } from "../motion";
import { acceptNote, closeNote, keyPress, openNote } from "./shared";
import styles from "../Film.module.css";

export function NotesLayer() {
  return (
    <div className={styles.layer} aria-hidden="true">
      <div className={styles.lower}>
        <p className={styles.caption} data-f="n-looking">
          Feedback where you&rsquo;re already looking.
        </p>
        <p className={styles.caption} data-f="n-key">
          Every note is one key away.
        </p>
      </div>
    </div>
  );
}

export const notesKeys: Scene = {
  id: "notes",
  title: "Notes in the margin",
  duration: 9.2,
  build(tl, ctx, t) {
    const { q, camera, beat } = ctx;
    const keys = Array.from(q("keys").children);
    gsap.set([q("n-looking"), q("n-key")], hidden());
    gsap.set(keys, hiddenUi());
    gsap.set(q("cmd"), { ...hiddenUi(), scale: 0.98 });

    camera.to(
      tl,
      {
        els: [
          q("mark-wordy"),
          q("mark-spelling"),
          q("slot-wordy"),
          q("slot-spelling"),
        ],
        fill: 0.86,
      },
      t,
      { duration: 1.8 },
    );
    reveal(tl, q("n-looking"), t + 0.4);
    reveal(tl, keys, t + 1.0, { stagger: 0.06, duration: 0.7 });

    keyPress(tl, ctx, "j", t + 1.8);
    openNote(tl, ctx, "wordy", t + 1.85);
    keyPress(tl, ctx, "j", t + 2.7);
    closeNote(tl, ctx, "wordy", t + 2.75);
    openNote(tl, ctx, "spelling", t + 2.75);
    keyPress(tl, ctx, "k", t + 3.5);
    closeNote(tl, ctx, "spelling", t + 3.55);
    openNote(tl, ctx, "wordy", t + 3.55);
    keyPress(tl, ctx, "enter", t + 4.3);
    acceptNote(tl, ctx, "wordy", t + 4.35, [4, 3]);

    conceal(tl, q("n-looking"), t + 4.7);
    reveal(tl, q("n-key"), t + 5.1);

    keyPress(tl, ctx, "j", t + 5.6);
    openNote(tl, ctx, "spelling", t + 5.65);
    keyPress(tl, ctx, "enter", t + 6.3);
    acceptNote(tl, ctx, "spelling", t + 6.35, [3, 2]);

    // The command menu opens over the app, so the camera makes room for it.
    keyPress(tl, ctx, "cmdk", t + 7.3);
    camera.to(tl, {}, t + 7.1, { duration: 1.1 });
    reveal(tl, q("cmd"), t + 7.4, { scale: 1, duration: 0.5 });
    beat(tl, "menu", t + 7.4);
    conceal(tl, q("cmd"), t + 8.6, { y: 0, scale: 0.98, duration: 0.3 });
    conceal(tl, q("n-key"), t + 8.7);
    conceal(tl, keys, t + 8.8, { stagger: 0.04, duration: 0.4 });
  },
};
