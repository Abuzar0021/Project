/**
 * Scene 7. Why the suggestions sound like the writer. The writer's own past
 * drafts gather into the voice meter, the meter explains what it learned
 * from, and a phrase that doesn't sound like them gets flagged and fixed.
 * The meter climbs to show the draft sounds more like its author.
 */

import { gsap } from "gsap";
import type { Scene } from "../motion";
import {
  EASE,
  conceal,
  countTo,
  hidden,
  hiddenUi,
  reveal,
  split,
} from "../motion";
import { acceptNote, openNote, token } from "./shared";
import styles from "../Film.module.css";

const DRAFTS = [
  { title: "Reply to Hanna re: refund", line: "We’ll sort it out today." },
  { title: "Q4 board memo", line: "Here’s where we landed." },
  { title: "Onboarding email 2", line: "You’re all set. Two quick things:" },
  { title: "Launch notes", line: "Short version first, detail below." },
  { title: "Hiring update", line: "We’ll share the plan on Friday." },
];

/** Drawn inside the app, so the camera carries it with the product. */
export function VoiceOverlay() {
  return (
    <>
      {DRAFTS.map((draft) => (
        <div key={draft.title} className={styles.draft} data-f="draft">
          <div className={styles.draftTitle}>{draft.title}</div>
          <div className={styles.draftLine}>{draft.line}</div>
        </div>
      ))}
      <div className={styles.voicePop} data-f="voice-pop">
        Trained on <b>41</b> of your drafts
      </div>
    </>
  );
}

export function VoiceLayer() {
  return (
    <>
      <div className={`${styles.layer} ${styles.center}`} aria-hidden="true">
        <p className={styles.title} data-f="v-same">
          AI shouldn&rsquo;t make everyone sound the same.
        </p>
      </div>
      <div className={styles.layer} aria-hidden="true">
        <div className={styles.lower}>
          <p className={styles.caption} data-f="v-learns">
            Margin learns how you write.
          </p>
          <p className={`${styles.caption} ${styles.quiet}`} data-f="v-else">
            Not how everyone else writes.
          </p>
        </div>
      </div>
    </>
  );
}

export const voice: Scene = {
  id: "voice",
  title: "Your voice",
  duration: 10,
  build(tl, ctx, t) {
    const { q, qa, camera, inApp, compact, beat } = ctx;
    const same = split(q("v-same"));
    const drafts = qa("draft");
    const chip = q("chip-voice");
    const home = inApp(chip);
    gsap.set([...same, q("v-learns"), q("v-else")], hidden());

    // Lay the drafts out in two loose rows under the meter, then aim each
    // one at the meter so it can fly in.
    const across = compact ? 2 : 3;
    drafts.forEach((draft, i) => {
      const col = i % across;
      const row = Math.floor(i / across);
      const left = Math.max(
        16,
        home.x + home.w - 230 - col * 240 - (row % 2) * 110,
      );
      const top = home.y + 64 + row * 92 + (col % 2) * 12;
      gsap.set(draft, { left, top, ...hiddenUi(), scale: 0.96 });
    });
    const pop = { left: home.x + home.w - 230, top: home.y + home.h + 8 };
    gsap.set(q("voice-pop"), { ...pop, ...hiddenUi() });

    tl.to(q("dim"), { opacity: 0.86, duration: 0.8 }, t);
    reveal(tl, same, t + 0.3, { stagger: 0.06 });
    beat(tl, "line", t + 0.3);
    conceal(tl, q("v-same"), t + 2.2);
    tl.to(q("dim"), { opacity: 0, duration: 0.8 }, t + 2.3);

    camera.to(tl, { els: [chip, ...drafts], fill: 0.9 }, t + 2.1, {
      duration: 1.8,
    });
    reveal(tl, drafts, t + 2.6, { stagger: 0.1, scale: 1, duration: 0.8 });
    drafts.forEach((draft, i) => {
      const from = { x: draft.offsetLeft, y: draft.offsetTop };
      tl.to(
        draft,
        {
          x: home.x + home.w / 2 - from.x - 110,
          y: home.y + home.h / 2 - from.y - 24,
          scale: 0.12,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power3.in",
        },
        t + 3.9 + i * 0.1,
      );
    });
    beat(tl, "gather", t + 3.9);
    reveal(tl, q("voice-pop"), t + 4.6, { duration: 0.6 });
    tl.to(
      chip,
      { backgroundColor: token(ctx, "--hover"), duration: 0.3 },
      t + 4.5,
    );

    // The one phrase that doesn't sound like them.
    // The note and the meter share the shot: the full page width on a wide
    // screen, just the meter and the note on a phone.
    const both = compact
      ? { els: [chip, q("mark-voice"), q("slot-voice")], fill: 0.92, dy: 40 }
      : { els: [q("topbar"), q("slot-voice")], fill: 0.84, dy: 50 };
    camera.to(tl, both, t + 5.5, {
      duration: 1.7,
    });
    conceal(tl, q("voice-pop"), t + 5.7, { y: 0, duration: 0.3 });
    tl.to(
      chip,
      { backgroundColor: "rgba(0, 0, 0, 0)", duration: 0.4 },
      t + 5.7,
    );
    openNote(tl, ctx, "voice", t + 6.3);
    acceptNote(tl, ctx, "voice", t + 7.2, [2, 1]);

    tl.to(
      q("meter-fill"),
      { width: "94%", duration: 0.8, ease: EASE.move },
      t + 8.0,
    );
    countTo(tl, q("meter-num"), 86, 94, t + 8.0, 0.8);
    tl.to(
      chip,
      { backgroundColor: token(ctx, "--hover"), duration: 0.3 },
      t + 8.0,
    );
    tl.to(
      chip,
      { backgroundColor: "rgba(0, 0, 0, 0)", duration: 0.6 },
      t + 9.0,
    );
    beat(tl, "meter", t + 8.0);

    reveal(tl, q("v-learns"), t + 7.4);
    conceal(tl, q("v-learns"), t + 8.6);
    reveal(tl, q("v-else"), t + 8.8);
    conceal(tl, q("v-else"), t + 9.8);
  },
};
