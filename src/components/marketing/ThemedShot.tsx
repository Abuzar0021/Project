/**
 * ThemedShot: a real product screenshot that matches the reader's theme.
 * Every shot is captured in light and dark by scripts/capture-screenshots.mjs;
 * both render and CSS shows the one that matches data-theme or the OS scheme,
 * so a stored theme choice from the editor carries over. The pair shares one
 * alt text; the hidden one is display:none and never announced.
 */
import Image from "next/image";
import shots from "./shots.json";
import styles from "./ThemedShot.module.css";

export type ShotName = keyof typeof shots;

export function ThemedShot({
  name,
  alt,
  sizes,
  priority = false,
  focusRight = false,
}: {
  name: ShotName;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** On phones, show the right side of the shot near full size (the margin
   * notes) instead of the whole desktop capture shrunk past legibility. */
  focusRight?: boolean;
}) {
  const { width, height } = shots[name];
  // Captured at 2x; never display a shot larger than its natural CSS size.
  const style = { maxWidth: `${width / 2}px` };
  const base = focusRight ? `${styles.shot} ${styles.focusRight}` : styles.shot;

  return (
    <>
      <Image
        className={`${base} ${styles.light}`}
        style={style}
        src={`/marketing/${name}-light.png`}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        quality={90}
        priority={priority}
      />
      <Image
        className={`${base} ${styles.dark}`}
        style={style}
        src={`/marketing/${name}-dark.png`}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        quality={90}
        priority={priority}
      />
    </>
  );
}
