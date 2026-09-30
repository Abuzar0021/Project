/**
 * Scene 3. The draft writes itself onto the page from the edge the bar just
 * became. Underlines draw under the words that need a look, their notes
 * come out into the margin, and the camera pulls back to show the whole app
 * settling around the page.
 */

import { gsap } from "gsap";
import type { Scene } from "../motion";
import { EASE, hidden, hiddenUi, reveal } from "../motion";
import { NOTES } from "../FilmProduct";

export const revealScene: Scene = {
  id: "reveal",
  title: "The editor",
  duration: 5.6,
  build(tl, { q, qa, camera, beat }, t) {
    const paragraphs = qa("para");
    const marks = NOTES.map((note) => q(`mark-${note.id}`));
    const slots = NOTES.filter((note) => note.id !== "passive").map((note) =>
      q(`slot-${note.id}`),
    );
    const chrome = [...qa("side"), q("topbar"), q("status")];

    gsap.set([q("doc-title"), q("doc-meta")], hidden());
    gsap.set(paragraphs, { clipPath: "inset(0% 100% 0% 0%)" });
    gsap.set(q("slot-passive"), hidden());
    gsap.set(slots, { ...hiddenUi(), x: -24 });
    gsap.set(chrome, { autoAlpha: 0 });
    // Underlines start clear and draw in with their own color.
    const colors = marks.map(
      (mark) => getComputedStyle(mark).textDecorationColor,
    );
    gsap.set(marks, { textDecorationColor: "rgba(0, 0, 0, 0)" });

    reveal(tl, q("doc-title"), t);
    reveal(tl, q("doc-meta"), t + 0.2);
    tl.to(
      paragraphs,
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.3,
        stagger: 0.28,
        ease: EASE.move,
      },
      t + 0.3,
    );
    beat(tl, "write", t + 0.3);
    tl.to(q("shape-bar"), { autoAlpha: 0, duration: 0.9 }, t + 0.6);

    marks.forEach((mark, i) => {
      tl.to(
        mark,
        { textDecorationColor: colors[i], duration: 0.4 },
        t + 1.7 + i * 0.16,
      );
    });
    beat(tl, "underline", t + 1.7);

    tl.to(q("surface-passive"), { opacity: 0, duration: 0.4 }, t + 2.3);
    reveal(tl, slots, t + 2.4, { stagger: 0.14, duration: 0.9 });
    beat(tl, "notes", t + 2.4);

    camera.to(tl, {}, t + 3.0, { duration: 2.4 });
    reveal(tl, chrome, t + 3.3, { stagger: 0.15, duration: 1.2 });
    beat(tl, "wide", t + 3.0);
  },
};
