/**
 * The film's motion language, shared by every scene so the whole piece moves
 * the same way: one set of eases, one way to bring type in and out, one
 * camera, and one list of named beats for sound design.
 */

import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import type { RefObject } from "react";
import type { DitheredLogoHandle } from "@/components/marketing/DitheredLogo";

/** Physical, never bouncy: fast in, soft landing. */
export const EASE = {
  in: "expo.out",
  out: "power2.in",
  move: "power3.inOut",
  camera: "power2.inOut",
  land: "power4.out",
} as const;

export type Timeline = gsap.core.Timeline;

/** Everything a scene needs to build its part of the film. */
export interface FilmContext {
  /** One element by its data-f name. */
  q: (name: string) => HTMLElement;
  /** Every element with a data-f name. */
  qa: (name: string) => HTMLElement[];
  /** Offset of an element inside the app frame. */
  inApp: (el: HTMLElement) => Box;
  camera: Camera;
  compact: boolean;
  logo: RefObject<DitheredLogoHandle | null>;
  /** Mark a sound cue at a position on the timeline. */
  beat: (tl: Timeline, name: string, at: number) => void;
}

/** Scenes build in order, each from its start time, and report its length. */
export interface Scene {
  id: string;
  title: string;
  duration: number;
  build: (tl: Timeline, ctx: FilmContext, t: number) => void;
}

let reduced = false;

/**
 * With reduced motion the film keeps its story and timing but drops blur,
 * drift and camera travel: type fades, shots cut.
 */
export function setReducedMotion(value: boolean) {
  reduced = value;
}

/** Soft focus to sharp, rising slightly. The film's main way to show type. */
export function reveal(
  tl: Timeline,
  targets: gsap.TweenTarget,
  at: number,
  vars: gsap.TweenVars = {},
) {
  return tl.to(
    targets,
    {
      autoAlpha: 1,
      y: 0,
      x: 0,
      filter: "blur(0px)",
      duration: 1.1,
      ease: EASE.in,
      ...vars,
    },
    at,
  );
}

/** The reverse of reveal: drift up and soften away. */
export function conceal(
  tl: Timeline,
  targets: gsap.TweenTarget,
  at: number,
  vars: gsap.TweenVars = {},
) {
  return tl.to(
    targets,
    {
      autoAlpha: 0,
      y: reduced ? 0 : -10,
      filter: reduced ? "blur(0px)" : "blur(8px)",
      duration: 0.6,
      ease: EASE.out,
      ...vars,
    },
    at,
  );
}

/** The resting state reveal() animates from. */
export function hidden(): gsap.TweenVars {
  return reduced
    ? { autoAlpha: 0 }
    : { autoAlpha: 0, y: 14, filter: "blur(10px)" };
}

/** Mild version of hidden() for small interface pieces. */
export function hiddenUi(): gsap.TweenVars {
  return reduced
    ? { autoAlpha: 0 }
    : { autoAlpha: 0, y: 8, filter: "blur(4px)" };
}

/** Split a line into words, or characters inside words, for staggered type. */
export function split(
  el: HTMLElement,
  by: "words" | "chars" = "words",
): HTMLElement[] {
  const parts = SplitText.create(el, {
    type: by === "chars" ? "words,chars" : "words",
  });
  return (by === "chars" ? parts.chars : parts.words) as HTMLElement[];
}

/** Count a number up or down in an element's text, reversibly. */
export function countTo(
  tl: Timeline,
  el: HTMLElement,
  from: number,
  to: number,
  at: number,
  duration = 0.6,
) {
  const value = { n: from };
  return tl.to(
    value,
    {
      n: to,
      duration,
      ease: "power1.inOut",
      onUpdate: () => {
        el.textContent = String(Math.round(value.n));
      },
    },
    at,
  );
}

/** A quick press on a key cap or button: down, then back up. */
export function press(tl: Timeline, el: gsap.TweenTarget, at: number) {
  tl.to(el, { y: 2, scale: 0.96, duration: 0.08, ease: "power2.out" }, at);
  tl.to(el, { y: 0, scale: 1, duration: 0.3, ease: EASE.land }, at + 0.08);
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Offset of an element inside an ancestor, ignoring transforms. */
export function offsetWithin(el: HTMLElement, ancestor: HTMLElement): Box {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/** The smallest box around several boxes. */
function union(boxes: Box[]): Box {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.w));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));
  return { x, y, w: right - x, h: bottom - y };
}

/**
 * How a shot is framed. With no elements it is the wide shot of the whole
 * frame, optionally zoomed. With elements, the camera fits them so they fill
 * the given share of the viewfinder, then nudges by dx and dy (frame pixels).
 */
export interface Framing {
  els?: HTMLElement[];
  fill?: number;
  zoom?: number;
  dx?: number;
  dy?: number;
}

interface Shot {
  scale: number;
  x: number;
  y: number;
}

/**
 * A camera over the product frame. The frame is laid out at a fixed size and
 * the camera scales and moves it, so every shot is framed the same way on
 * every screen. The viewfinder leaves a band at the bottom for captions and
 * controls. Shots are worked out when the film is built, which happens again
 * after a resize.
 */
export class Camera {
  constructor(
    private readonly rig: HTMLElement,
    private readonly frame: HTMLElement,
    private readonly stage: HTMLElement,
  ) {}

  /** The part of the stage product shots are composed in. */
  private viewfinder(): Box {
    const w = this.stage.clientWidth;
    const h = this.stage.clientHeight;
    const side = w < 700 ? 12 : 56;
    const top = w < 700 ? 64 : 48;
    const bottom = w < 700 ? 150 : 132;
    return { x: side, y: top, w: w - side * 2, h: h - top - bottom };
  }

  resolve({ els, fill = 0.8, zoom = 1, dx = 0, dy = 0 }: Framing = {}): Shot {
    const view = this.viewfinder();
    let box: Box;
    let scale: number;
    if (els && els.length > 0) {
      box = union(els.map((el) => offsetWithin(el, this.frame)));
      scale =
        Math.min((view.w * fill) / box.w, (view.h * fill) / box.h, 3) * zoom;
    } else {
      box = {
        x: 0,
        y: 0,
        w: this.frame.offsetWidth,
        h: this.frame.offsetHeight,
      };
      scale = Math.min(view.w / box.w, view.h / box.h) * zoom;
    }
    const cx = box.x + box.w / 2 + dx;
    const cy = box.y + box.h / 2 + dy;
    return {
      scale,
      x: view.x + view.w / 2 - cx * scale,
      y: view.y + view.h / 2 - cy * scale,
    };
  }

  /** Where an element lands on the stage when a shot is on screen. */
  project(el: HTMLElement, framing: Framing = {}): Box {
    const shot = this.resolve(framing);
    const box = offsetWithin(el, this.frame);
    return {
      x: shot.x + box.x * shot.scale,
      y: shot.y + box.y * shot.scale,
      w: box.w * shot.scale,
      h: box.h * shot.scale,
    };
  }

  /** Put the camera on a shot without moving. */
  set(framing: Framing = {}) {
    gsap.set(this.rig, this.resolve(framing));
  }

  /** Move the camera to a shot. With reduced motion, cut to it. */
  to(tl: Timeline, framing: Framing, at: number, vars: gsap.TweenVars = {}) {
    return tl.to(
      this.rig,
      {
        ...this.resolve(framing),
        duration: 1.6,
        ease: EASE.camera,
        ...vars,
        ...(reduced ? { duration: 0.01 } : {}),
      },
      at,
    );
  }

  /** A hard cut, for montage. */
  cut(tl: Timeline, framing: Framing, at: number) {
    return tl.set(this.rig, this.resolve(framing), at);
  }
}

/** Named sound cues, in the order they happen, for whoever scores the film. */
export const BEATS: { name: string; time: number }[] = [];

export const BEAT_EVENT = "margin:film-beat";
