import site from "./site.module.css";
import styles from "./ComingSoon.module.css";

export function ComingSoon({ title }: { title: string }) {
  return (
    <section className={`${site.wrap} ${styles.page}`}>
      <h1 className={site.d1}>{title}</h1>
      <p className={`${site.lead} ${styles.soon}`}>Coming soon.</p>
    </section>
  );
}
