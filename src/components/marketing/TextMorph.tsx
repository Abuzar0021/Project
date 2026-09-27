"use client";

/**
 * Text morph: cycles through a few short words, blending each into the next
 * with a blur and a threshold filter so the letters appear to melt together.
 * The box eases to each word's width, so the surrounding line moves smoothly.
 *
 * Based on the Componentry text-morph component. Differences from the
 * original: styles live in a CSS module instead of Tailwind classes, and
 * screen readers get one stable word (the first) in visually hidden text
 * instead of an aria-label that changes every few seconds.
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./TextMorph.module.css";

export interface TextMorphProps {
  /** Words or short phrases to cycle through. The first is what screen readers hear. */
  words?: string[];
  /** How long each word rests before the next morph, in milliseconds. */
  interval?: number;
  /** How long the morph itself takes, in milliseconds. */
  morphDuration?: number;
  className?: string;
}

const DEFAULT_WORDS = ["IMAGINE", "REFINE", "RELEASE"];
const MORPH_BLUR = 12;
/** Alpha multiplier in the threshold filter; higher gives crisper edges. */
const MORPH_THRESHOLD = 18;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(value: number) {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
}

/** Layers are written to directly each frame to keep React out of the loop. */
function setLayerStyles(
  element: HTMLSpanElement,
  opacity: number,
  blur: number,
  scale: number,
) {
  element.style.opacity = opacity.toFixed(4);
  element.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : "none";
  element.style.transform = `translateX(-50%) scale(${scale.toFixed(4)})`;
}

export function TextMorph({
  words = DEFAULT_WORDS,
  interval = 2600,
  morphDuration = 680,
  className,
}: TextMorphProps) {
  const values = useMemo(() => {
    const filtered = words.filter((word) => word.trim().length > 0);
    return filtered.length > 0 ? filtered : DEFAULT_WORDS;
  }, [words]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentLayerRef = useRef<HTMLSpanElement>(null);
  const nextLayerRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLSpanElement>(null);
  const holdTimerRef = useRef<number | undefined>(undefined);
  const frameRef = useRef<number | undefined>(undefined);
  const morphingRef = useRef(false);
  const reducedMotion = usePrefersReducedMotion();
  const reactId = useId().replace(/:/g, "");
  const filterId = `text-morph-threshold-${reactId}`;

  const safeIndex = currentIndex % values.length;
  const nextIndex = (safeIndex + 1) % values.length;
  const currentWord = values[safeIndex] ?? "";
  const nextWord = values[nextIndex] ?? "";
  const thresholdOffset = -MORPH_THRESHOLD * 0.46;

  /** Size the stage to one layer so the text around it reflows smoothly. */
  const measureStage = useCallback(
    (target: "current" | "next", immediate = false) => {
      const stage = stageRef.current;
      const layer =
        target === "current" ? currentLayerRef.current : nextLayerRef.current;
      if (!stage || !layer) return;

      // offsetWidth and offsetHeight ignore transforms, so both layers are
      // measured at their crisp resting size around the same center.
      const width = layer.offsetWidth;
      const height = layer.offsetHeight;
      if (immediate || reducedMotion) {
        const previousTransition = stage.style.transition;
        stage.style.transition = "none";
        stage.style.width = `${width}px`;
        stage.style.height = `${height}px`;
        void stage.offsetWidth;
        stage.style.transition = previousTransition;
        return;
      }

      stage.style.width = `${width}px`;
      stage.style.height = `${height}px`;
    },
    [reducedMotion],
  );

  // Reset both layers to rest whenever the word changes.
  useLayoutEffect(() => {
    const currentLayer = currentLayerRef.current;
    const nextLayer = nextLayerRef.current;
    const stage = stageRef.current;
    if (!currentLayer || !nextLayer || !stage) return;

    setLayerStyles(currentLayer, 1, 0, 1);
    setLayerStyles(nextLayer, 0, reducedMotion ? 0 : MORPH_BLUR, 0.992);
    currentLayer.style.willChange = "auto";
    nextLayer.style.willChange = "auto";
    stage.style.filter = "none";
    const duration = Math.max(160, morphDuration);
    stage.style.transition = reducedMotion
      ? "none"
      : `width ${duration}ms ${EASE}, height ${duration}ms ${EASE}`;
    measureStage("current", true);
  }, [currentIndex, measureStage, morphDuration, reducedMotion, values]);

  // Re-measure when fonts load or the text size changes.
  useEffect(() => {
    const currentLayer = currentLayerRef.current;
    const nextLayer = nextLayerRef.current;
    if (!currentLayer || !nextLayer) return;

    const observer = new ResizeObserver(() => {
      if (!morphingRef.current) measureStage("current", true);
    });
    observer.observe(currentLayer);
    observer.observe(nextLayer);
    return () => observer.disconnect();
  }, [measureStage]);

  const beginMorph = useCallback(() => {
    const currentLayer = currentLayerRef.current;
    const nextLayer = nextLayerRef.current;
    const stage = stageRef.current;
    if (
      !currentLayer ||
      !nextLayer ||
      !stage ||
      morphingRef.current ||
      values.length < 2
    ) {
      return;
    }

    morphingRef.current = true;
    currentLayer.style.willChange = "opacity, filter, transform";
    nextLayer.style.willChange = "opacity, filter, transform";
    stage.style.filter = reducedMotion ? "none" : `url(#${filterId})`;
    measureStage("next");

    const startedAt = performance.now();
    const resolvedDuration = reducedMotion ? 140 : Math.max(240, morphDuration);

    const renderFrame = (now: number) => {
      const progress = clamp((now - startedAt) / resolvedDuration);
      const eased = smoothstep(progress);

      if (reducedMotion) {
        setLayerStyles(currentLayer, 1 - eased, 0, 1);
        setLayerStyles(nextLayer, eased, 0, 1);
      } else {
        // The incoming word starts early and the outgoing one lingers. Their
        // overlap gives the threshold filter enough shared alpha to look fluid.
        const incoming = smoothstep(clamp(progress / 0.82));
        const outgoing = smoothstep(clamp((progress - 0.18) / 0.82));

        setLayerStyles(
          currentLayer,
          Math.pow(1 - outgoing, 0.55),
          MORPH_BLUR * outgoing,
          1 - outgoing * 0.012,
        );
        setLayerStyles(
          nextLayer,
          Math.pow(incoming, 0.55),
          MORPH_BLUR * (1 - incoming),
          0.988 + incoming * 0.012,
        );
      }

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(renderFrame);
        return;
      }

      stage.style.filter = "none";
      currentLayer.style.willChange = "auto";
      nextLayer.style.willChange = "auto";
      morphingRef.current = false;
      setCurrentIndex(nextIndex);
    };

    frameRef.current = window.requestAnimationFrame(renderFrame);
  }, [
    filterId,
    measureStage,
    morphDuration,
    nextIndex,
    reducedMotion,
    values.length,
  ]);

  // Rest on each word, then morph to the next.
  useEffect(() => {
    if (values.length < 2) return;

    holdTimerRef.current = window.setTimeout(
      beginMorph,
      Math.max(400, interval),
    );

    return () => {
      if (holdTimerRef.current !== undefined) {
        window.clearTimeout(holdTimerRef.current);
      }
    };
  }, [beginMorph, currentIndex, interval, values.length]);

  useEffect(
    () => () => {
      if (holdTimerRef.current !== undefined) {
        window.clearTimeout(holdTimerRef.current);
      }
      if (frameRef.current !== undefined) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  // If the word list shrinks, start again from the first word.
  useEffect(() => {
    if (currentIndex < values.length) return;
    setCurrentIndex(0);
  }, [currentIndex, values.length]);

  return (
    <span className={className ? `${styles.root} ${className}` : styles.root}>
      <span className="sr-only">{values[0]}</span>
      <svg aria-hidden="true" focusable="false" className={styles.defs}>
        <defs>
          <filter
            id={filterId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${MORPH_THRESHOLD} ${thresholdOffset}`}
              result="thresholded"
            />
            <feComposite in="SourceGraphic" in2="thresholded" operator="atop" />
          </filter>
        </defs>
      </svg>

      <span ref={stageRef} aria-hidden="true" className={styles.stage}>
        <span
          ref={currentLayerRef}
          className={styles.layer}
          style={{ transform: "translateX(-50%)" }}
        >
          {currentWord}
        </span>
        <span
          ref={nextLayerRef}
          className={styles.layer}
          style={{
            opacity: 0,
            filter: `blur(${MORPH_BLUR}px)`,
            transform: "translateX(-50%) scale(0.992)",
          }}
        >
          {nextWord}
        </span>
      </span>
    </span>
  );
}
