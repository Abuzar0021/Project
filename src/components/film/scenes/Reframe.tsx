/**
 * Scene 2. The mark answers the problem. The dithered logo resolves out of
 * the dark and ripples; then it flattens into its two plain shapes, and
 * those shapes become what they always stood for: the bar turns into the
 * edge of a page, the circle into the first note in its margin.
 */

import { gsap } from "gsap";
import type { Ref } from "react";
import {
  DitheredLogo,
  type DitheredLogoHandle,
} from "@/components/marketing/DitheredLogo";
import type { Box, FilmContext, Framing, Scene } from "../motion";
import { EASE, conceal, hidden, offsetWithin, reveal, split } from "../motion";
import { token } from "./shared";
import styles from "../Film.module.css";

/** Share of the logo box the drawn mark fills; DitheredLogo centers it. */
const MARK_SCALE = 0.8;

export function LogoLayer({ controls }: { controls: Ref<DitheredLogoHandle> }) {
  return (
    <>
      <div className={styles.logo} data-f="logo" aria-hidden="true">
        <DitheredLogo
          imageSrc="/margin-mark.svg"
          gridSize={72}
          scale={MARK_SCALE}
          dotScale={0.72}
          cornerRadius={0}
          blur={0}
          className={styles.logoCanvas}
          controls={controls}
        />
      </div>
      <div className={styles.shape} data-f="shape-bar" />
      <div className={styles.shape} data-f="shape-dot" />
      <div className={styles.word} data-f="word-a" aria-hidden="true">
        <p className={styles.wordmark} data-f="wordmark-a">
          Margin
        </p>
        <p className={styles.tagline} data-f="tagline-a">
          An editor beside your writing.
        </p>
      </div>
    </>
  );
}

/**
 * The two shapes of the mark as they sit in the logo, in stage pixels. The
 * numbers are the rectangle and circle from margin-mark.svg (240 wide).
 */
export function markShapes({ q }: FilmContext): {
  bar: gsap.TweenVars;
  dot: gsap.TweenVars;
} {
  const box = offsetWithin(q("logo"), q("stage"));
  const size = box.w * MARK_SCALE;
  const x = box.x + (box.w - size) / 2;
  const y = box.y + (box.h - size) / 2;
  const u = size / 240;
  return {
    bar: {
      left: x + 60 * u,
      top: y + 40 * u,
      width: 26 * u,
      height: 160 * u,
      borderRadius: 6 * u,
    },
    dot: {
      left: x + 128 * u,
      top: y + 48 * u,
      width: 80 * u,
      height: 80 * u,
      borderRadius: 40 * u,
    },
  };
}

/** Where a shape should sit to cover a box on the stage. */
export function over(box: Box, radius: number): gsap.TweenVars {
  return {
    left: box.x,
    top: box.y,
    width: box.w,
    height: box.h,
    borderRadius: radius,
  };
}

/** The first product shot: the page and its margin, a little close. */
export function openingShot({ q }: FilmContext): Framing {
  return { els: [q("doc"), q("notes")], fill: 0.96 };
}

export const reframe: Scene = {
  id: "reframe",
  title: "Margin",
  duration: 7.4,
  build(tl, ctx, t) {
    const { q, camera, logo, beat } = ctx;
    const shapes = markShapes(ctx);
    const letters = split(q("wordmark-a"), "chars");
    gsap.set(q("logo"), { autoAlpha: 0, clipPath: "inset(50% 0% 50% 0%)" });
    gsap.set(q("shape-bar"), { ...shapes.bar, autoAlpha: 0 });
    gsap.set(q("shape-dot"), { ...shapes.dot, autoAlpha: 0 });
    gsap.set([...letters, q("tagline-a")], hidden());

    tl.to(
      q("logo"),
      {
        autoAlpha: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.4,
        ease: EASE.move,
      },
      t + 0.2,
    );
    beat(tl, "logo", t + 0.2);
    tl.call(() => logo.current?.ripple(0.5, 0.5), [], t + 0.6);
    reveal(tl, letters, t + 1.3, { stagger: 0.035 });
    reveal(tl, q("tagline-a"), t + 1.9);
    // A second ripple starts at the circle: the note speaks up.
    tl.call(() => logo.current?.ripple(0.66, 0.39), [], t + 2.4);
    conceal(tl, q("word-a"), t + 3.6);

    // Flatten: the dots give way to two solid shapes in the same place.
    tl.to(
      [q("shape-bar"), q("shape-dot")],
      { autoAlpha: 1, duration: 0.5 },
      t + 4.0,
    );
    tl.to(q("logo"), { autoAlpha: 0, duration: 0.7 }, t + 4.1);
    beat(tl, "flatten", t + 4.0);

    // The product arrives around them, settling onto the opening shot.
    const shot = openingShot(ctx);
    camera.set({ ...shot, zoom: 0.9 });
    gsap.set(q("rig"), { autoAlpha: 0 });
    tl.to(
      q("rig"),
      { autoAlpha: 1, duration: 1.2, ease: "power1.inOut" },
      t + 4.6,
    );
    camera.to(tl, shot, t + 4.6, { duration: 2.6, ease: EASE.land });

    // The bar becomes the page edge, the circle the first note.
    const doc = camera.project(q("doc"), shot);
    const note = camera.project(q("note-passive"), shot);
    const edge = { x: doc.x - 16, y: doc.y, w: 2, h: doc.h * 0.7 };
    tl.to(
      q("shape-bar"),
      { ...over(edge, 1), duration: 1.6, ease: EASE.move },
      t + 4.7,
    );
    // On the way it cools from ink to the grey of a card edge.
    tl.to(
      q("shape-dot"),
      {
        ...over(note, 8),
        backgroundColor: token(ctx, "--rule"),
        duration: 1.6,
        ease: EASE.move,
      },
      t + 4.8,
    );
    beat(tl, "arrive", t + 6.4);
    tl.to(q("shape-dot"), { autoAlpha: 0, duration: 0.5 }, t + 6.3);
    tl.to(q("surface-passive"), { opacity: 1, duration: 0.5 }, t + 6.3);
    reveal(tl, q("slot-passive"), t + 6.4, { duration: 0.8 });
  },
};
