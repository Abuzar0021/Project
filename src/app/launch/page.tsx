/**
 * /launch: the Margin launch film. The film itself is decorative motion, so
 * the page also carries its full script as text for screen readers.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/account";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Footer } from "@/components/marketing/Footer";
import { LaunchFilm } from "@/components/film/LaunchFilm";
import site from "@/components/marketing/site.module.css";
import styles from "@/components/film/Film.module.css";

export const metadata: Metadata = {
  title: "The film",
  description:
    "Why Margin exists, in ninety seconds: an editor that helps you see your writing and leaves the decisions to you.",
};

const SCRIPT = [
  "Writing with AI got faster. But writing still has a problem.",
  "Write. Ask AI. Generate. Rewrite. Copy. Edit.",
  "Somewhere along the way, the writing stopped feeling like yours.",
  "Margin. An editor beside your writing.",
  "A draft opens with short notes in the margin beside the lines they are about.",
  "A passive sentence, “The new pricing was decided by the team”, is flagged. The writer accepts the note and it becomes “The team decided the new pricing”.",
  "Margin doesn’t replace your writing. It helps you see it. You decide what stays.",
  "Feedback where you’re already looking. J and K move between notes, Enter accepts, S keeps the original, and Command K opens every command. Every note is one key away.",
  "Sentence rhythm draws a bar for each sentence. The one that runs to 52 words turns amber. Good writing has a rhythm. Margin shows you where it runs long.",
  "AI shouldn’t make everyone sound the same. The voice meter is trained on 41 of your drafts. “We shall” is flagged as not your voice and becomes “We’ll”, and the meter rises from 86 to 94 percent. Margin learns how you write. Not how everyone else writes.",
  "The writer keeps the word “utilize”. Margin files it in Stet memory. In another draft the same suggestion starts, finds the kept word, and disappears. Say no once. Stay heard.",
  "Built for the keyboard. Because your hands are already on the page.",
  "Your drafts stay yours. No training on your text. Delete means gone. Cancel in one click.",
  "AI can write. Margin helps you decide. Keep the pen.",
  "Margin. The writing editor that keeps your voice.",
];

export default async function LaunchPage() {
  const signedIn = (await cookies()).has(SESSION_COOKIE);
  return (
    <div className={`site ${styles.screen}`}>
      <header className={`${site.wrap} ${styles.header}`}>
        <Link href="/" aria-label="Margin home">
          <Logo size={20} />
        </Link>
        <nav className={styles.headerLinks} aria-label="Film">
          <a href="#after">Skip the film</a>
          {signedIn ? (
            <Link href="/app">Open Margin</Link>
          ) : (
            <Link href="/signup">Sign up</Link>
          )}
        </nav>
      </header>

      <main>
        <h1 className={styles.transcript}>Margin, the film</h1>
        <LaunchFilm />
        <section className={styles.transcript} aria-label="Film script">
          {SCRIPT.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>

        <section id="after" className={`${site.wrap} ${styles.after}`}>
          <h2 className={site.d2}>Keep the pen.</h2>
          <p className={styles.afterLead}>
            Margin checks spelling, clarity and tone, then leaves short notes
            beside your text. You decide what stays.
          </p>
          <div className={styles.afterActions}>
            <ButtonLink href={signedIn ? "/app" : "/signup"} variant="primary">
              {signedIn ? "Open Margin" : "Write your next draft in Margin"}
            </ButtonLink>
            <ButtonLink href="/" variant="outline">
              Back to the site
            </ButtonLink>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
