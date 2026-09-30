/**
 * Pieces several scenes share: the key caps, and the three things a note can
 * go through (open, accept, close), written once so every note in the film
 * behaves exactly like every other.
 */

import type { FilmContext, Timeline } from "../motion";
import { EASE, conceal, countTo, press } from "../motion";
import { NOTES } from "../FilmProduct";
import styles from "../Film.module.css";

export const KEYS = [
  { id: "j", cap: "J", label: "next" },
  { id: "k", cap: "K", label: "previous" },
  { id: "enter", cap: "↵", label: "accept" },
  { id: "s", cap: "S", label: "stet" },
  { id: "cmdk", cap: "⌘K", label: "commands" },
] as const;

export type KeyId = (typeof KEYS)[number]["id"];

/** The row of key caps. Scenes show all of it, part of it, or none. */
export function KeysLayer() {
  return (
    <div className={styles.layer} aria-hidden="true">
      <div className={styles.keys} data-f="keys">
        {KEYS.map((key) => (
          <div className={styles.keyWrap} key={key.id} data-f={`key-${key.id}`}>
            <div className={styles.key} data-f={`cap-${key.id}`}>
              {key.cap}
              <span className={styles.keyOn} data-f={`on-${key.id}`} />
            </div>
            <span className={styles.keyLabel}>{key.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Press a key cap: it dips and its ring lights, with a beat. */
export function keyPress(
  tl: Timeline,
  ctx: FilmContext,
  id: KeyId,
  at: number,
) {
  press(tl, ctx.q(`cap-${id}`), at);
  tl.to(ctx.q(`on-${id}`), { opacity: 1, duration: 0.06 }, at);
  tl.to(
    ctx.q(`on-${id}`),
    { opacity: 0, duration: 0.5, ease: "power1.out" },
    at + 0.3,
  );
  ctx.beat(tl, `key-${id}`, at);
}

/** Read a token from the app's own theme, so tweens land on real colors. */
export function token(ctx: FilmContext, name: string): string {
  return getComputedStyle(ctx.q("app")).getPropertyValue(name).trim();
}

const ORDER = NOTES.map((note) => note.id);

/**
 * Keep the margin tidy as a note opens or closes: every note below it moves
 * down just enough to clear it, or back to its own line.
 */
function makeRoom(
  tl: Timeline,
  ctx: FilmContext,
  id: string,
  at: number,
  open: boolean,
) {
  const slot = ctx.q(`slot-${id}`);
  const extra = open ? ctx.q(`more-${id}`).scrollHeight : 0;
  let bottom = slot.offsetTop + slot.offsetHeight + extra + 8;
  for (const next of ORDER.slice(ORDER.indexOf(id) + 1)) {
    const el = ctx.q(`slot-${next}`);
    const push = open ? Math.max(0, bottom - el.offsetTop) : 0;
    tl.to(el, { y: push, duration: 0.45, ease: EASE.move }, at);
    bottom = el.offsetTop + push + el.offsetHeight + 8;
  }
}

/** Make a note the active one: its mark tints, its card lifts and opens. */
export function openNote(
  tl: Timeline,
  ctx: FilmContext,
  id: string,
  at: number,
) {
  tl.to(
    ctx.q(`mark-${id}`),
    { backgroundColor: token(ctx, "--ac-soft"), duration: 0.25 },
    at,
  );
  tl.to(ctx.q(`surface-${id}`), { opacity: 1, duration: 0.25 }, at);
  tl.to(
    ctx.q(`more-${id}`),
    { height: "auto", duration: 0.45, ease: EASE.move },
    at,
  );
  makeRoom(tl, ctx, id, at, true);
}

/** Step off a note without deciding: it settles back to a summary. */
export function closeNote(
  tl: Timeline,
  ctx: FilmContext,
  id: string,
  at: number,
) {
  tl.to(
    ctx.q(`mark-${id}`),
    { backgroundColor: "rgba(0, 0, 0, 0)", duration: 0.25 },
    at,
  );
  tl.to(ctx.q(`surface-${id}`), { opacity: 0, duration: 0.25 }, at);
  tl.to(ctx.q(`more-${id}`), { height: 0, duration: 0.4, ease: EASE.move }, at);
  makeRoom(tl, ctx, id, at, false);
}

/**
 * Accept a note the way the editor does: the button goes down, a line strikes
 * the old words, they give way to the new ones, and the new ones carry a
 * short wash of ink so the eye finds them. The card leaves the margin and the
 * note count drops.
 */
export function acceptNote(
  tl: Timeline,
  ctx: FilmContext,
  id: string,
  at: number,
  count: [number, number],
  swap: { out?: HTMLElement; in?: HTMLElement } = {},
) {
  const out = swap.out ?? ctx.q(`mark-${id}`);
  const replacement = swap.in ?? ctx.q(`new-${id}`);
  press(tl, ctx.q(`accept-${id}`), at);
  ctx.beat(tl, `accept-${id}`, at);
  tl.to(
    ctx.q(`strike-${id}`),
    { scaleX: 1, duration: 0.35, ease: "power2.inOut" },
    at + 0.12,
  );
  tl.to(out, { autoAlpha: 0, duration: 0.2 }, at + 0.55);
  tl.set(out, { display: "none" }, at + 0.75);
  tl.set(replacement, { display: "inline" }, at + 0.75);
  tl.to(replacement, { autoAlpha: 1, duration: 0.2 }, at + 0.75);
  tl.to(
    replacement,
    { backgroundColor: "rgba(0, 0, 0, 0)", duration: 1.2, ease: "power1.out" },
    at + 0.95,
  );
  conceal(tl, ctx.q(`slot-${id}`), at + 0.6, { x: 10, y: 0 });
  makeRoom(tl, ctx, id, at + 0.7, false);
  noteCount(tl, ctx, count[0], count[1], at + 0.6);
}

/** The note count in the top bar, with "note" or "notes" as the app writes it. */
export function noteCount(
  tl: Timeline,
  ctx: FilmContext,
  from: number,
  to: number,
  at: number,
) {
  countTo(tl, ctx.q("count"), from, to, at, 0.3);
  tl.set(
    ctx.q("count-label"),
    { textContent: to === 1 ? "note" : "notes" },
    at + 0.3,
  );
}
