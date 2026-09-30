"use client";

/**
 * The launch film: twelve scenes on one GSAP timeline, played by scrolling.
 * The stage pins to the screen and the scroll position is the playhead, so
 * the viewer can scrub back and forth; Play scrolls at real time instead.
 *
 * Scenes build in order onto the master timeline. Everything is measured
 * when the film is built, so a resize (or a switch to the phone layout)
 * reverts the whole film and builds it again at the same point.
 *
 * Every named beat fires a "margin:film-beat" event on window as the
 * playhead crosses it, for sound design.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import type { DitheredLogoHandle } from "@/components/marketing/DitheredLogo";
import { FilmProduct } from "./FilmProduct";
import {
  BEATS,
  BEAT_EVENT,
  Camera,
  EASE,
  offsetWithin,
  setReducedMotion,
  type FilmContext,
  type Scene,
} from "./motion";
import { KeysLayer, token } from "./scenes/shared";
import { ProblemLayer, problem } from "./scenes/Problem";
import { LogoLayer, reframe } from "./scenes/Reframe";
import { revealScene } from "./scenes/Reveal";
import { DifferenceLayer, difference } from "./scenes/Difference";
import { NotesLayer, notesKeys } from "./scenes/NotesKeys";
import { RhythmLayer, rhythm } from "./scenes/Rhythm";
import { VoiceLayer, VoiceOverlay, voice } from "./scenes/Voice";
import { StetLayer, stet } from "./scenes/Stet";
import { KeyboardLayer, keyboard } from "./scenes/Keyboard";
import { PrivacyLayer, privacy } from "./scenes/Privacy";
import { BigIdeaLayer, bigIdea } from "./scenes/BigIdea";
import { FinaleLayer, finale } from "./scenes/Finale";
import styles from "./Film.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin, SplitText);

export const SCENES: Scene[] = [
  problem,
  reframe,
  revealScene,
  difference,
  notesKeys,
  rhythm,
  voice,
  stet,
  keyboard,
  privacy,
  bigIdea,
  finale,
];

/** Scroll distance per second of film. */
const PX_PER_SECOND = 90;

function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function LaunchFilm() {
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<DitheredLogoHandle>(null);
  const chapter = useRef<HTMLSpanElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const playback = useRef<gsap.core.Tween | null>(null);
  const progress = useRef(0);
  const [compact, setCompact] = useState(false);
  const [build, setBuild] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Phones get the narrower product frame; the product re-measures itself
  // and asks for a rebuild when it has.
  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Rebuild after the stage changes size. Height changes smaller than a
  // mobile address bar are ignored.
  useEffect(() => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let timer = 0;
    const onResize = () => {
      if (
        window.innerWidth === width &&
        Math.abs(window.innerHeight - height) < 120
      ) {
        return;
      }
      width = window.innerWidth;
      height = window.innerHeight;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setBuild((n) => n + 1), 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);

  const onReady = useCallback(() => setBuild((n) => n + 1), []);

  useGSAP(
    () => {
      const film = root.current;
      const stage = film?.querySelector<HTMLElement>('[data-f="stage"]');
      if (build === 0 || !film || !stage) return;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      setReducedMotion(reduce);

      const q = (name: string) => {
        const el = film.querySelector<HTMLElement>(`[data-f="${name}"]`);
        if (!el) throw new Error(`Film: nothing is named "${name}"`);
        return el;
      };
      const qa = (name: string) =>
        Array.from(film.querySelectorAll<HTMLElement>(`[data-f="${name}"]`));
      const app = q("app");
      const camera = new Camera(q("rig"), q("frame"), stage);

      BEATS.length = 0;
      const ctx: FilmContext = {
        q,
        qa,
        inApp: (el) => offsetWithin(el, app),
        camera,
        compact,
        logo,
        beat(tl, name, at) {
          BEATS.push({ name, time: Math.round(at * 100) / 100 });
          tl.call(
            () =>
              window.dispatchEvent(
                new CustomEvent(BEAT_EVENT, { detail: { name, time: at } }),
              ),
            [],
            at,
          );
        },
      };

      // Replacement text waits, tinted with ink, for its note to be accepted.
      gsap.set(stage.querySelectorAll('[data-f^="new-"]'), {
        autoAlpha: 0,
        backgroundColor: token(ctx, "--ac-soft"),
      });

      const tl = gsap.timeline({ defaults: { ease: EASE.in } });
      const starts: number[] = [];
      let t = 0;
      for (const scene of SCENES) {
        starts.push(t);
        scene.build(tl, ctx, t);
        t += scene.duration;
      }
      tl.to(q("hint"), { autoAlpha: 0, duration: 0.3 }, 0.05);
      tl.fromTo(
        q("progress"),
        { scaleX: 0 },
        { scaleX: 1, duration: t, ease: "none" },
        0,
      );

      const total = tl.duration();
      const render = (seconds: number) => {
        let index = 0;
        while ((starts[index + 1] ?? Infinity) <= seconds) index++;
        if (chapter.current) {
          chapter.current.textContent = `${String(index + 1).padStart(2, "0")} / ${SCENES.length}  ${SCENES[index]?.title ?? ""}`;
        }
        if (time.current) {
          time.current.textContent = `${clock(seconds)} / ${clock(total)}`;
        }
      };

      const st = ScrollTrigger.create({
        trigger: root.current,
        pin: stage,
        start: "top top",
        end: `+=${Math.round(total * PX_PER_SECOND)}`,
        scrub: reduce ? true : 0.6,
        anticipatePin: 1,
        animation: tl,
        onUpdate: (self) => {
          progress.current = self.progress;
          render(self.progress * total);
        },
      });
      trigger.current = st;
      render(0);

      // Pick up where the viewer was before a rebuild.
      if (progress.current > 0) {
        window.scrollTo(0, st.start + progress.current * (st.end - st.start));
      }
      stage.dataset.ready = "true";

      return () => {
        playback.current?.kill();
        trigger.current = null;
        setPlaying(false);
      };
    },
    { scope: root, dependencies: [build], revertOnUpdate: true },
  );

  useEffect(() => () => void playback.current?.kill(), []);

  const toggle = () => {
    const st = trigger.current;
    if (!st) return;
    if (playing) {
      playback.current?.kill();
      setPlaying(false);
      return;
    }
    const total = st.animation?.duration() ?? 0;
    let from = st.progress;
    if (from >= 0.999 || window.scrollY < st.start) {
      window.scrollTo(0, st.start);
      from = 0;
    }
    const stop = () => setPlaying(false);
    playback.current = gsap.to(window, {
      scrollTo: { y: st.end, autoKill: true, onAutoKill: stop },
      duration: (1 - from) * total,
      ease: "none",
      onComplete: stop,
    });
    setPlaying(true);
  };

  return (
    <div className={styles.film} ref={root}>
      <div className={styles.stage} data-f="stage" data-ready="false">
        <div className={styles.rig} data-f="rig" aria-hidden="true">
          <FilmProduct compact={compact} onReady={onReady}>
            <VoiceOverlay />
          </FilmProduct>
        </div>
        <div className={styles.dim} data-f="dim" />
        <div className={`${styles.band} ${styles.bandTop}`} />
        <div className={`${styles.band} ${styles.bandBottom}`} />

        <LogoLayer controls={logo} />
        <ProblemLayer />
        <DifferenceLayer />
        <NotesLayer />
        <RhythmLayer />
        <VoiceLayer />
        <StetLayer />
        <KeysLayer />
        <KeyboardLayer />
        <PrivacyLayer />
        <BigIdeaLayer />
        <FinaleLayer />

        <p className={styles.hint} data-f="hint" aria-hidden="true">
          Scroll to play
        </p>
        <div className={styles.progress} data-f="progress" />
        <div className={styles.controls}>
          <span className={styles.chapter} ref={chapter} aria-hidden="true" />
          <span className={styles.time} ref={time} aria-hidden="true" />
          <button type="button" className={styles.play} onClick={toggle}>
            {playing ? (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                aria-hidden="true"
              >
                <rect x="1" y="1" width="3" height="8" />
                <rect x="6" y="1" width="3" height="8" />
              </svg>
            ) : (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                aria-hidden="true"
              >
                <path d="M2 1 L9 5 L2 9 Z" />
              </svg>
            )}
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </div>
    </div>
  );
}
