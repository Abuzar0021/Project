/**
 * Buttons and button-styled links in the five variants from the design:
 * pill, primary, outline, and the two small app buttons.
 */

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "pill" | "primary" | "outline" | "app-primary" | "app-outline";

interface Look {
  variant: Variant;
  block?: boolean;
  className?: string;
}

function classes({ variant, block, className }: Look): string {
  return [
    styles.button,
    styles[variant],
    block ? styles.block : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  block,
  className,
  type = "button",
  ...rest
}: Look & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={classes({ variant, block, className })}
      {...rest}
    />
  );
}

export function ButtonLink({
  href,
  children,
  ...look
}: Look & { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={classes(look)}>
      {children}
    </Link>
  );
}
