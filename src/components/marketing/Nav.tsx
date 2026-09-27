/** Sticky site navigation. */

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { NavLinks } from "./NavLinks";
import site from "./site.module.css";
import styles from "./Nav.module.css";

export function Nav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className={styles.nav}>
      <div className={`${site.wrap} ${styles.inner}`}>
        <Link href="/" className={styles.logo} aria-label="Margin home">
          <Logo size={20} />
        </Link>
        <NavLinks />
        <span className={styles.sep} aria-hidden="true" />
        {signedIn ? (
          <ButtonLink variant="pill" href="/app" className={styles.push}>
            Open Margin
          </ButtonLink>
        ) : (
          <>
            <Link href="/login" className={`${styles.login} ${styles.push}`}>
              Log in
            </Link>
            <ButtonLink variant="pill" href="/signup">
              Sign up
            </ButtonLink>
          </>
        )}
      </div>
    </header>
  );
}
