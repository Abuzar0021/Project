import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={`site ${styles.page}`}>
      <Link href="/" aria-label="Margin home" className={styles.logo}>
        <Logo size={20} />
      </Link>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.text}>The link may be old, or the page moved.</p>
      <Link href="/" className={styles.home}>
        Back to the home page
      </Link>
    </div>
  );
}
