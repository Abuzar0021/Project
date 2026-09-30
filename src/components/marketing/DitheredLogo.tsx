"use client";

/**
 * Dithered logo: turns a solid logo image into a field of dots that drift away
 * from the pointer and ripple on click. Used once, above the landing headline.
 *
 * Based on the Componentry dithered-logo component. Differences from the
 * original: styles live in a CSS module instead of Tailwind classes, the dots
 * redraw when the site theme changes, the field holds still for visitors who
 * prefer reduced motion, and the canvas is hidden from screen readers because
 * the "Margin" wordmark next to it already names the product.
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion --
   The pixel and particle loops index typed arrays within bounds set by the
   loop counters. Asserting there keeps the hot loops free of extra branches. */

import {
  type CSSProperties,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styles from "./DitheredLogo.module.css";

interface GrayscaleResult {
  grayscale: Uint8Array;
  alpha: Uint8Array;
  width: number;
  height: number;
}

interface DitherConfig {
  threshold: number;
  serpentine: boolean;
  diffusionStrength: number;
}

/** Particle state kept in flat typed arrays so each frame allocates nothing. */
interface ParticleSystem {
  count: number;
  baseX: Float32Array;
  baseY: Float32Array;
  offsetX: Float32Array;
  offsetY: Float32Array;
  brightness: Float32Array;
  tint: Float32Array;
  size: number;
}

interface Ripple {
  x: number;
  y: number;
  start: number;
}

const DEFAULTS = {
  gridSize: 200,
  scale: 0.5,
  dotScale: 1,
  invert: true,
  cornerRadius: 0.2,
  threshold: 180,
  contrast: 0,
  gamma: 1,
  blur: 3.75,
  diffusionStrength: 1,
  serpentine: true,
};

// Feel of the interaction: how far and how hard dots move, and how fast they
// settle back into place.
const RIPPLE_SPEED = 225;
const RIPPLE_WIDTH = 37;
const RIPPLE_FORCE = 20;
const RIPPLE_DURATION = 675;
const CURSOR_RADIUS = 100;
const CURSOR_RADIUS_SQ = CURSOR_RADIUS * CURSOR_RADIUS;
const CURSOR_FORCE = 40;
const LERP_FACTOR = 0.12;
const SNAP_THRESHOLD = 0.01;

/**
 * Sample the image into a small grayscale grid. The alpha channel comes from
 * the sharp image so the outline stays crisp; brightness comes from a slightly
 * blurred copy so the dither has smooth tones to work with.
 */
const toGrayscaleGrid = (
  img: HTMLImageElement,
  maxDim: number,
  contrast: number,
  gamma: number,
  blur: number,
): GrayscaleResult => {
  const aspect = img.naturalWidth / img.naturalHeight;
  const outW = aspect >= 1 ? maxDim : Math.round(maxDim * aspect);
  const outH = aspect >= 1 ? Math.round(maxDim / aspect) : maxDim;
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  const alphaCanvas = document.createElement("canvas");
  alphaCanvas.width = outW;
  alphaCanvas.height = outH;
  const alphaCtx = alphaCanvas.getContext("2d");
  if (!alphaCtx) {
    throw new Error("DitheredLogo: unable to create alpha canvas context.");
  }
  alphaCtx.imageSmoothingEnabled = true;
  alphaCtx.imageSmoothingQuality = "high";
  alphaCtx.drawImage(img, 0, 0, outW, outH);
  const alphaData = alphaCtx.getImageData(0, 0, outW, outH).data;

  // Pad before blurring so the blur does not bleed off the edges.
  const pad = Math.ceil(blur * 3);
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = srcW + pad * 2;
  srcCanvas.height = srcH + pad * 2;
  const srcCtx = srcCanvas.getContext("2d");
  if (!srcCtx) {
    throw new Error("DitheredLogo: unable to create source canvas context.");
  }
  if (blur > 0) srcCtx.filter = `blur(${blur}px)`;
  srcCtx.drawImage(img, pad, pad, srcW, srcH);
  srcCtx.filter = "none";

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(
      "DitheredLogo: unable to create processing canvas context.",
    );
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(srcCanvas, pad, pad, srcW, srcH, 0, 0, outW, outH);

  const pixels = ctx.getImageData(0, 0, outW, outH).data;
  const grayscale = new Uint8Array(outW * outH);
  const alpha = new Uint8Array(outW * outH);
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const idx = (y * outW + x) * 4;
      const blurAlpha = pixels[idx + 3]! / 255;
      alpha[y * outW + x] = alphaData[idx + 3]!;

      // Un-premultiply so edge pixels keep their true brightness.
      let luma =
        blurAlpha > 0.01
          ? (0.299 * pixels[idx]! +
              0.587 * pixels[idx + 1]! +
              0.114 * pixels[idx + 2]!) /
            blurAlpha
          : 0;

      if (contrast !== 0) luma = cFactor * (luma - 128) + 128;
      if (gamma !== 1) {
        luma = 255 * Math.pow(Math.max(0, luma / 255), 1 / gamma);
      }

      grayscale[y * outW + x] = Math.max(0, Math.min(255, Math.round(luma)));
    }
  }

  return { grayscale, alpha, width: outW, height: outH };
};

/**
 * Floyd-Steinberg dithering. Each pixel snaps to on or off and pushes its
 * rounding error onto the neighbours it has not visited yet. Serpentine order
 * flips direction every row to avoid diagonal streaks. Returns the grid
 * coordinates of every "on" pixel as flat x, y pairs.
 */
const errorDiffusionDither = (
  grayscale: Uint8Array,
  width: number,
  height: number,
  config: DitherConfig,
  alpha: Uint8Array,
): Float32Array => {
  const errors = new Float32Array(width * height);
  for (let i = 0; i < grayscale.length; i++) errors[i] = grayscale[i]!;

  const positions: number[] = [];
  const strength = config.diffusionStrength;

  for (let y = 0; y < height; y++) {
    const ltr = !config.serpentine || y % 2 === 0;
    const startX = ltr ? 0 : width - 1;
    const endX = ltr ? width : -1;
    const step = ltr ? 1 : -1;

    for (let x = startX; x !== endX; x += step) {
      const idx = y * width + x;
      if (alpha[idx]! < 128) continue;

      const oldVal = errors[idx]!;
      const newVal = oldVal > config.threshold ? 255 : 0;
      const err = (oldVal - newVal) * strength;

      if (newVal > 0) positions.push(x, y);

      const spread = (nx: number, ny: number, weight: number) => {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
        const ni = ny * width + nx;
        if (alpha[ni]! < 128) return;
        errors[ni] = errors[ni]! + err * weight;
      };

      spread(x + step, y, 7 / 16);
      spread(x - step, y + 1, 3 / 16);
      spread(x, y + 1, 5 / 16);
      spread(x + step, y + 1, 1 / 16);
    }
  }

  return new Float32Array(positions);
};

const fetchImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/** Cells inside a rounded rectangle covering the grid, as flat indexes. */
const buildRoundedMask = (
  w: number,
  h: number,
  radiusPct: number,
): Set<number> => {
  const r = Math.round(radiusPct * Math.min(w, h));
  const mask = new Set<number>();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let inside = false;
      if (x >= r && x < w - r) {
        inside = true;
      } else if (y >= r && y < h - r) {
        inside = true;
      } else {
        const cx = x < r ? r : w - r - 1;
        const cy = y < r ? r : h - r - 1;
        const dx = x - cx;
        const dy = y - cy;
        inside = dx * dx + dy * dy <= r * r;
      }
      if (inside) mask.add(y * w + x);
    }
  }

  return mask;
};

/**
 * Swap on and off inside the logo's shape. A dark logo dithers to almost no
 * "on" pixels, so inverting turns its solid areas into dots.
 */
const applyMaskInversion = (
  positions: Float32Array,
  gridW: number,
  gridH: number,
  radiusPct: number,
  alpha: Uint8Array,
): Float32Array => {
  const mask = buildRoundedMask(gridW, gridH, radiusPct);
  const filled = new Set<number>();

  for (let i = 0; i < positions.length; i += 2) {
    filled.add(
      Math.round(positions[i + 1]!) * gridW + Math.round(positions[i]!),
    );
  }

  const result: number[] = [];
  for (const idx of mask) {
    if (!filled.has(idx)) {
      if (alpha[idx]! < 128) continue;
      result.push(idx % gridW, Math.floor(idx / gridW));
    }
  }

  return new Float32Array(result);
};

/** Place one particle per dithered dot, scaled and centered in the canvas. */
const initParticles = (
  points: Float32Array,
  scaleFactor: number,
  dotScale: number,
  originX: number,
  originY: number,
): ParticleSystem => {
  const count = points.length / 2;
  const baseX = new Float32Array(count);
  const baseY = new Float32Array(count);
  const offsetX = new Float32Array(count);
  const offsetY = new Float32Array(count);
  const brightness = new Float32Array(count);
  const tint = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    baseX[i] = originX + points[i * 2]! * scaleFactor;
    baseY[i] = originY + points[i * 2 + 1]! * scaleFactor;
    brightness[i] = 1;
    tint[i] = 1;
  }

  return {
    count,
    baseX,
    baseY,
    offsetX,
    offsetY,
    brightness,
    tint,
    size: scaleFactor * dotScale,
  };
};

/**
 * Advance every particle one frame: push away from the pointer and from any
 * ripple rings passing through, then ease back toward home. Returns whether
 * anything is still moving, so the animation loop can stop when it settles.
 */
const stepParticles = (
  sys: ParticleSystem,
  cursorX: number,
  cursorY: number,
  cursorActive: boolean,
  ripples: Ripple[],
  now: number,
): boolean => {
  const { count, baseX, baseY, offsetX, offsetY } = sys;

  for (let k = ripples.length - 1; k >= 0; k--) {
    if (now - ripples[k]!.start >= RIPPLE_DURATION) ripples.splice(k, 1);
  }

  const numRipples = ripples.length;
  const rippleMul = numRipples > 0 ? 1 + 0.5 * (numRipples - 1) : 0;
  let hasMotion = false;

  for (let i = 0; i < count; i++) {
    let fx = 0;
    let fy = 0;

    if (cursorActive) {
      const vx = baseX[i]! + offsetX[i]! - cursorX;
      const vy = baseY[i]! + offsetY[i]! - cursorY;
      const d2 = vx * vx + vy * vy;
      if (d2 > 0.1 && d2 < CURSOR_RADIUS_SQ) {
        const d = Math.sqrt(d2);
        const f = (1 - d / CURSOR_RADIUS) ** 3 * CURSOR_FORCE;
        fx += (vx / d) * f;
        fy += (vy / d) * f;
      }
    }

    for (let k = 0; k < numRipples; k++) {
      const ripple = ripples[k]!;
      const elapsed = now - ripple.start;
      const radius = (elapsed / 1000) * RIPPLE_SPEED;
      const life = 1 - elapsed / RIPPLE_DURATION;
      const sx = baseX[i]! - ripple.x;
      const sy = baseY[i]! - ripple.y;
      const d = Math.sqrt(sx * sx + sy * sy);
      if (d < 0.1) continue;
      const band = Math.abs(d - radius);
      if (band < RIPPLE_WIDTH) {
        const wf = (1 - band / RIPPLE_WIDTH) * life * RIPPLE_FORCE * rippleMul;
        fx += (sx / d) * wf;
        fy += (sy / d) * wf;
      }
    }

    offsetX[i] = offsetX[i]! + (fx - offsetX[i]!) * LERP_FACTOR;
    offsetY[i] = offsetY[i]! + (fy - offsetY[i]!) * LERP_FACTOR;
    if (Math.abs(offsetX[i]!) < SNAP_THRESHOLD) offsetX[i] = 0;
    if (Math.abs(offsetY[i]!) < SNAP_THRESHOLD) offsetY[i] = 0;
    if (offsetX[i] !== 0 || offsetY[i] !== 0) hasMotion = true;
  }

  return hasMotion || numRipples > 0 || cursorActive;
};

/**
 * Draw every particle. Dots are grouped into opacity buckets first so the
 * canvas only changes fill state a handful of times per frame.
 */
const drawParticles = (
  ctx: CanvasRenderingContext2D,
  sys: ParticleSystem,
  particleColor: string,
  canvasW: number,
  canvasH: number,
  dpr: number,
) => {
  ctx.clearRect(0, 0, canvasW * dpr, canvasH * dpr);

  const buckets: number[][] = new Array<number[]>(126);

  for (let i = 0; i < 126; i++) buckets[i] = [];

  for (let i = 0; i < sys.count; i++) {
    const bucket =
      6 * Math.round(20 * sys.brightness[i]!) + Math.round(5 * sys.tint[i]!);
    buckets[Math.max(0, Math.min(125, bucket))]!.push(i);
  }

  const size = sys.size * dpr;
  const pad = 0.25 * dpr;
  const padSize = 0.5 * dpr;

  for (let z = 0; z < 126; z++) {
    const ids = buckets[z]!;
    if (ids.length === 0) continue;
    const alpha = Math.floor(z / 6) / 20;
    ctx.fillStyle = particleColor;
    ctx.globalAlpha = alpha;

    for (const i of ids) {
      const rx = (sys.baseX[i]! + sys.offsetX[i]!) * dpr;
      const ry = (sys.baseY[i]! + sys.offsetY[i]!) * dpr;
      ctx.fillRect(rx - pad, ry - pad, size + padSize, size + padSize);
    }
  }

  ctx.globalAlpha = 1;
};

/**
 * Drive the same effects the pointer produces, for scripted moments such as
 * the launch film. Positions are fractions of the canvas, from 0 to 1.
 */
export interface DitheredLogoHandle {
  /** Send a ripple ring out from a point, as a click does. */
  ripple: (x?: number, y?: number) => void;
  /** Push the dots away from a point, as a hovering pointer does. */
  stir: (x: number, y: number) => void;
  /** Let the dots drift back home. */
  settle: () => void;
}

export interface DitheredLogoProps {
  /** Image or SVG to turn into dots. Must be same-origin so pixels can be read. */
  imageSrc: string;
  /** Largest sampled dimension before dithering; lower means bigger dots. */
  gridSize?: number;
  /** Size of the logo relative to the canvas. */
  scale?: number;
  /** Size of each dot relative to its grid cell. */
  dotScale?: number;
  /** Turn the logo's solid areas into dots. Needed for dark logos. */
  invert?: boolean;
  cornerRadius?: number;
  threshold?: number;
  contrast?: number;
  gamma?: number;
  blur?: number;
  diffusionStrength?: number;
  serpentine?: boolean;
  /** Dot color. Defaults to the element's text color. */
  particleColor?: string;
  style?: CSSProperties;
  className?: string;
  /** Optional handle for triggering ripples and pushes from code. */
  controls?: Ref<DitheredLogoHandle>;
}

export function DitheredLogo({
  imageSrc,
  gridSize = DEFAULTS.gridSize,
  scale = DEFAULTS.scale,
  dotScale = DEFAULTS.dotScale,
  invert = DEFAULTS.invert,
  cornerRadius = DEFAULTS.cornerRadius,
  threshold = DEFAULTS.threshold,
  contrast = DEFAULTS.contrast,
  gamma = DEFAULTS.gamma,
  blur = DEFAULTS.blur,
  diffusionStrength = DEFAULTS.diffusionStrength,
  serpentine = DEFAULTS.serpentine,
  particleColor = "currentColor",
  style,
  className,
  controls,
}: DitheredLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<ParticleSystem | null>(null);
  const cursorRef = useRef({ x: 0, y: 0, active: false });
  const ripplesRef = useRef<Ripple[]>([]);
  const animFrameRef = useRef(0);
  const runningRef = useRef(false);
  const prevConfigRef = useRef("");
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const resolveParticleColor = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return particleColor;
    return particleColor === "currentColor"
      ? getComputedStyle(canvas).color
      : particleColor;
  }, [particleColor]);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 640px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsMobile(mobile.matches);
    setReducedMotion(motion.matches);
    const onMobile = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    const onMotion = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    mobile.addEventListener("change", onMobile);
    motion.addEventListener("change", onMotion);
    return () => {
      mobile.removeEventListener("change", onMobile);
      motion.removeEventListener("change", onMotion);
    };
  }, []);

  /** Run frames until every dot has settled, then stop to save battery. */
  const startLoop = useCallback(() => {
    if (runningRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    runningRef.current = true;
    const dpr = window.devicePixelRatio || 1;

    const tick = () => {
      const sys = systemRef.current;
      if (!sys) {
        runningRef.current = false;
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const needsMore = stepParticles(
        sys,
        cursorRef.current.x,
        cursorRef.current.y,
        cursorRef.current.active,
        ripplesRef.current,
        performance.now(),
      );

      drawParticles(
        ctx,
        sys,
        resolveParticleColor(),
        rect.width,
        rect.height,
        dpr,
      );

      if (needsMore) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        runningRef.current = false;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [resolveParticleColor]);

  /** Load the image and rebuild the particles for the current settings. */
  const rebuild = useCallback(
    async (src: string) => {
      const canvas = canvasRef.current;
      if (!canvas || !src) return;

      try {
        const img = await fetchImage(src);
        const rect = canvas.getBoundingClientRect();
        const processed = toGrayscaleGrid(img, gridSize, contrast, gamma, blur);
        const { width: gridW, height: gridH } = processed;

        let positions = errorDiffusionDither(
          processed.grayscale,
          gridW,
          gridH,
          { threshold, serpentine, diffusionStrength },
          processed.alpha,
        );

        if (invert) {
          positions = applyMaskInversion(
            positions,
            gridW,
            gridH,
            cornerRadius,
            processed.alpha,
          );
        }

        const scaleFactor = Math.max(
          0.5,
          (Math.min(rect.width, rect.height) * scale) / Math.max(gridW, gridH),
        );
        const originX = Math.round((rect.width - gridW * scaleFactor) / 2);
        const originY = Math.round((rect.height - gridH * scaleFactor) / 2);
        const responsiveDotScale = isMobile ? dotScale * 0.8 : dotScale;

        systemRef.current = initParticles(
          positions,
          scaleFactor,
          responsiveDotScale,
          originX,
          originY,
        );
        startLoop();
      } catch (error) {
        console.error("DitheredLogo: failed to process image", error);
      }
    },
    [
      gridSize,
      scale,
      dotScale,
      invert,
      cornerRadius,
      threshold,
      contrast,
      gamma,
      blur,
      diffusionStrength,
      serpentine,
      isMobile,
      startLoop,
    ],
  );

  useImperativeHandle(controls, () => {
    const point = (x: number, y: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      return rect ? { x: rect.width * x, y: rect.height * y } : { x: 0, y: 0 };
    };
    return {
      ripple: (x = 0.5, y = 0.5) => {
        if (reducedMotion) return;
        ripplesRef.current.push({ ...point(x, y), start: performance.now() });
        startLoop();
      },
      stir: (x, y) => {
        if (reducedMotion) return;
        cursorRef.current = { ...point(x, y), active: true };
        startLoop();
      },
      settle: () => {
        cursorRef.current.active = false;
        startLoop();
      },
    };
  }, [reducedMotion, startLoop]);

  // Rebuild only when a setting actually changes, not on every render.
  useEffect(() => {
    const key = JSON.stringify([
      imageSrc,
      gridSize,
      scale,
      dotScale,
      invert,
      cornerRadius,
      threshold,
      contrast,
      gamma,
      blur,
      diffusionStrength,
      serpentine,
      isMobile,
    ]);

    if (key === prevConfigRef.current) return;
    prevConfigRef.current = key;
    void rebuild(imageSrc);
  }, [
    imageSrc,
    gridSize,
    scale,
    dotScale,
    invert,
    cornerRadius,
    threshold,
    contrast,
    gamma,
    blur,
    diffusionStrength,
    serpentine,
    isMobile,
    rebuild,
  ]);

  // Canvas sizing, theme changes and pointer input.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let lastW = 0;
    let lastH = 0;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));

      const sys = systemRef.current;
      if (sys) {
        drawParticles(
          ctx,
          sys,
          resolveParticleColor(),
          rect.width,
          rect.height,
          dpr,
        );
      }

      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (lastW !== 0 && (w !== lastW || h !== lastH)) {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => void rebuild(imageSrc), 200);
      }
      lastW = w;
      lastH = h;
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      cursorRef.current.x = event.clientX - rect.left;
      cursorRef.current.y = event.clientY - rect.top;
      cursorRef.current.active = true;
      startLoop();
    };

    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      cursorRef.current.active = false;
      startLoop();
    };

    const onPointerCancel = () => {
      cursorRef.current.active = false;
      startLoop();
    };

    const onPointerUp = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ripplesRef.current.push({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        start: performance.now(),
      });

      if (event.pointerType !== "mouse") cursorRef.current.active = false;
      startLoop();
    };

    // With reduced motion the dots stay put: settle any that are mid-flight
    // and do not listen to the pointer at all.
    const interactive = !reducedMotion;
    if (!interactive) {
      cursorRef.current.active = false;
      ripplesRef.current = [];
      systemRef.current?.offsetX.fill(0);
      systemRef.current?.offsetY.fill(0);
    }

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    // The site switches themes with data-theme or follows the OS setting.
    const themeObserver = new MutationObserver(() => handleResize());
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    resizeObserver.observe(canvas);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
    colorScheme.addEventListener("change", handleResize);
    if (interactive) {
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerleave", onPointerLeave);
      canvas.addEventListener("pointercancel", onPointerCancel);
      canvas.addEventListener("pointerup", onPointerUp);
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      runningRef.current = false;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      colorScheme.removeEventListener("change", handleResize);
      if (interactive) {
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        canvas.removeEventListener("pointercancel", onPointerCancel);
        canvas.removeEventListener("pointerup", onPointerUp);
      }
    };
  }, [startLoop, rebuild, imageSrc, resolveParticleColor, reducedMotion]);

  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      style={style}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
