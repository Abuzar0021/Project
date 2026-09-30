/** Site footer: the logo and three columns of links. */

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import site from "./site.module.css";
import styles from "./Footer.module.css";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/changelog", label: "Changelog" },
      { href: "/launch", label: "The film" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className={site.wrap}>
      <div className={styles.foot}>
        <div>
          <Link href="/" className={styles.logo} aria-label="Margin home">
            <Logo size={20} />
          </Link>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className={styles.heading}>{column.title}</h2>
            {column.links.map((link) => (
              <Link key={link.href} href={link.href} className={styles.link}>
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
    </footer>
  );
}
