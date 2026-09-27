import { ButtonLink } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import Link from "next/link";
import site from "./site.module.css";
import styles from "./Landing.module.css";

const KEYS = [
  { keys: ["J", "K"], label: "Next and previous note" },
  { keys: ["↵"], label: "Accept" },
  { keys: ["S"], label: "Stet, keep yours" },
  { keys: ["R"], label: "Show rhythm" },
  { keys: ["⌘", "K"], label: "Command bar" },
];

const PROMISES = [
  {
    title: "No training on your text",
    text: "Your drafts shape your own voice profile and nothing else.",
  },
  {
    title: "Delete means gone",
    text: "Remove a draft and it’s removed from our servers the same day.",
  },
  {
    title: "Cancel in one click",
    text: "No retention calls and no hidden renewal. Your plan ends when you say.",
  },
];

export function KeyboardSection() {
  return (
    <section className={`${site.wrap} ${site.section}`}>
      <div className={site.split}>
        <h2 className={site.d2}>Built for the keyboard</h2>
        <p className={site.lead}>
          Move through a draft&rsquo;s notes without touching the mouse.
          Everything else is one command away.
        </p>
      </div>
      <ul className={styles.keys}>
        {KEYS.map((item) => (
          <li key={item.label} className={styles.key}>
            {item.keys.map((key) => (
              <Kbd key={key} variant="site">
                {key}
              </Kbd>
            ))}
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PrivacySection() {
  return (
    <section className={`${site.wrap} ${site.section}`}>
      <div className={site.split}>
        <h2 className={site.d2}>Your drafts stay yours</h2>
        <p className={site.lead}>Writing is private until you say otherwise.</p>
      </div>
      <div className={styles.promises}>
        {PROMISES.map((promise) => (
          <div key={promise.title}>
            <h3 className={styles.promiseTitle}>{promise.title}</h3>
            <p className={styles.promiseText}>{promise.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className={`${site.wrap} ${site.section}`}>
      <div className={styles.cta}>
        <h2 className={site.d2}>Write your next draft in Margin</h2>
        <div className={styles.ctaActions}>
          <Link href="/pricing" className={site.ghost}>
            See pricing &rarr;
          </Link>
          <ButtonLink variant="pill" href="/signup">
            Sign up
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
