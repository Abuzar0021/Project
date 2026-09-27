import site from "./site.module.css";
import styles from "./FeatureGrid.module.css";

const BARS = [42, 58, 24, 96, 36, 18];

export function FeatureGrid() {
  return (
    <section className={`${site.wrap} ${site.section}`} id="features">
      <div className={site.split}>
        <h2 className={site.d2}>Feedback where you&rsquo;re already looking</h2>
        <p className={site.lead}>
          No sidebar full of cards and no popups over your words. Every
          suggestion sits in the margin, next to the line it&rsquo;s about.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.cell}>
          <h3 className={site.d3}>Notes in the margin</h3>
          <p>
            Each note lines up with its sentence. Accept with Enter, keep your
            version with S, and move on.
          </p>
          <div className={styles.visual}>
            <div className={styles.note}>
              <div className={styles.noteHead}>
                <i aria-hidden="true" />
                Passive voice
              </div>
              <div className={styles.noteFix}>
                <s>was decided by the team</s> &nbsp;the team decided
              </div>
            </div>
          </div>
        </div>

        <div className={styles.cell}>
          <h3 className={site.d3}>Sentence rhythm</h3>
          <p>
            A bar for every sentence, drawn beside the text. Run-ons stand out
            before a reader trips on them.
          </p>
          <div className={styles.visual}>
            <div className={styles.bars} aria-hidden="true">
              {BARS.map((width, i) => (
                <div
                  key={i}
                  className={width > 90 ? styles.long : ""}
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.cell}>
          <h3 className={site.d3}>Sounds like you</h3>
          <p>
            Margin reads your past drafts and flags edits that would make you
            sound like everyone else.
          </p>
          <div className={styles.visual}>
            <div className={styles.meter}>
              <span>Voice</span>
              <span className={styles.track} aria-hidden="true">
                <i />
              </span>
              <span>94%</span>
            </div>
            <p className={styles.small}>Trained on 41 of your drafts</p>
          </div>
        </div>

        <div className={styles.cell} id="stet-memory">
          <h3 className={site.d3}>Stet memory</h3>
          <p>
            Say no to a suggestion once and it stays said. Margin won&rsquo;t
            raise it again, in this draft or the next.
          </p>
          <div className={styles.visual}>
            <div className={styles.memo}>
              Kept. Margin won&rsquo;t flag <b>&ldquo;utilize&rdquo;</b> again
              in any of your drafts.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
