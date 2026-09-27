/**
 * MarketingPage: the standalone page at / (DESIGN 14). Same tokens and type as
 * the product, no landing-page template on top. A two-column hero (dithered mark,
 * plain headline, one sentence, one button, and a real screenshot of the editor
 * mid-use), three feature rows that each pair one sentence with a real capture,
 * and a footer with nothing in it but the brand and the way in.
 *
 * Every image is a capture of the actual app, produced by
 * scripts/capture-screenshots.mjs. Nothing here animates except the dithered
 * mark, which responds to the pointer and holds still under reduced motion.
 */
import Link from "next/link";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { DitheredLogo } from "./DitheredLogo";
import { ThemedShot, type ShotName } from "./ThemedShot";
import styles from "./MarketingPage.module.css";

interface Feature {
  shot: ShotName;
  title: string;
  body: React.ReactNode;
  alt: string;
  /** Crop to the margin notes on phones (see ThemedShot). */
  focusRight?: boolean;
}

const FEATURES: Feature[] = [
  {
    shot: "rail",
    title: "Notes sit beside the line they're about",
    body: "Other checkers pile every issue into a sidebar you have to cross-reference; Margin pins each note level with its line, the way a copy editor's pencil marks a manuscript, so the problem and the fix share one glance.",
    alt: "An active margin note for the typo shiped, expanded beside its line with the replacement shipped and Apply and Dismiss buttons.",
    focusRight: true,
  },
  {
    shot: "card",
    title: "Fix it without leaving the sentence",
    body: (
      <>
        Open a suggestion from its underline or with <kbd>Ctrl</kbd>{" "}
        <kbd>J</kbd>, then press <kbd>Enter</kbd> to apply it, <kbd>D</kbd> to
        dismiss it, or <kbd>Ctrl</kbd> <kbd>Z</kbd> to take it back.
      </>
    ),
    alt: "A suggestion card open under the misspelled word wether, offering whether and weather, with Apply, Dismiss, Ignore this rule, and Add to dictionary.",
  },
  {
    shot: "marks",
    title: "Four kinds of line for four kinds of note",
    body: "Spelling and grammar get a wavy line, clarity dotted, tone dashed, and style doubled, so each category reads by its shape as well as its color.",
    alt: "A draft with four underline styles: wavy for spelling, dotted for a long sentence, dashed for hedging and passive voice, and double for a repeated word.",
  },
];

export function MarketingPage() {
  return (
    <div className={styles.page}>
      <main>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroText}>
            <div className={styles.lockup}>
              <DitheredLogo
                imageSrc="/margin-mark.svg"
                className={styles.heroMark}
                gridSize={48}
                scale={0.72}
                dotScale={0.45}
                cornerRadius={0}
              />
              <span className={styles.heroWord}>Margin</span>
            </div>
            <h1 id="hero-title" className={styles.headline}>
              Suggestions that live where you&apos;re writing, not where they
              get in the way.
            </h1>
            <p className={styles.sub}>
              Margin checks your draft as you write and pins each note beside
              the line it refers to, so you can fix it without losing your
              place.
            </p>
            <Link href="/app" className={styles.primary}>
              Open the editor
            </Link>
          </div>
          <figure className={`${styles.heroShot} ${styles.shotFocus}`}>
            <ThemedShot
              name="hero"
              alt="The Margin editor with a draft open. Words are underlined by category and a column of notes sits beside the text, each level with its line. The pointer rests on a hedging note, and a thin line connects it to the words sort of."
              sizes="(min-width: 960px) 60vw, (min-width: 768px) 100vw, 240vw"
              priority
              focusRight
            />
          </figure>
        </section>

        {FEATURES.map((feature) => (
          <section
            key={feature.shot}
            className={styles.feature}
            aria-labelledby={`feature-${feature.shot}`}
          >
            <div className={styles.featureText}>
              <h2
                id={`feature-${feature.shot}`}
                className={styles.featureTitle}
              >
                {feature.title}
              </h2>
              <p className={styles.featureBody}>{feature.body}</p>
            </div>
            <figure
              className={
                feature.focusRight
                  ? `${styles.featureShot} ${styles.shotFocus}`
                  : styles.featureShot
              }
            >
              <ThemedShot
                name={feature.shot}
                alt={feature.alt}
                sizes={
                  feature.focusRight
                    ? "(min-width: 960px) 60vw, (min-width: 768px) 100vw, 240vw"
                    : "(min-width: 960px) 60vw, 100vw"
                }
                focusRight={feature.focusRight}
              />
            </figure>
          </section>
        ))}
      </main>

      <footer className={styles.footer}>
        <BrandLockup />
        <Link href="/app" className={styles.footerLink}>
          Open the editor
        </Link>
      </footer>
    </div>
  );
}
