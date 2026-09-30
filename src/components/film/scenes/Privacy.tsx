/**
 * Scene 10. The quiet part. The app steps back into the dark and the film
 * states the three promises from the site, word for word.
 */

import { gsap } from "gsap";
import type { Scene } from "../motion";
import { EASE, conceal, hidden, reveal, split } from "../motion";
import { PROMISES } from "@/components/marketing/LandingSections";
import styles from "../Film.module.css";

export function PrivacyLayer() {
  return (
    <div className={`${styles.layer} ${styles.center}`} aria-hidden="true">
      <div className={styles.stack} data-f="y-all">
        <div>
          <p className={styles.title} data-f="y-yours">
            Your drafts stay yours.
          </p>
          <div className={styles.promises}>
            {PROMISES.map((promise) => (
              <div
                key={promise.title}
                className={styles.promise}
                data-f="y-promise"
              >
                <h3>{promise.title}</h3>
                <p>{promise.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const privacy: Scene = {
  id: "privacy",
  title: "Privacy",
  duration: 5.4,
  build(tl, { q, qa, camera, beat }, t) {
    const yours = split(q("y-yours"));
    gsap.set([...yours, ...qa("y-promise")], hidden());

    tl.to(q("dim"), { opacity: 0.93, duration: 1.2, ease: "power1.inOut" }, t);
    camera.to(tl, { zoom: 0.78 }, t, { duration: 6, ease: "sine.inOut" });
    reveal(tl, yours, t + 0.5, { stagger: 0.07 });
    beat(tl, "line", t + 0.5);
    reveal(tl, qa("y-promise"), t + 1.7, { stagger: 0.25 });
    conceal(tl, q("y-all"), t + 4.7, { duration: 0.7, ease: EASE.move });
  },
};
