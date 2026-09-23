/**
 * Button: the one hand-built button primitive for Margin's chrome.
 * Variants keep the top bar quiet (ghost) while allowing a single loud action
 * (primary) elsewhere. All sizing and color come from tokens, and the shared
 * focus ring from globals, so buttons never drift from the design system.
 */
"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "ghost", className, type, ...rest }, ref) {
    const classes = [styles.button, styles[variant], className]
      .filter(Boolean)
      .join(" ");
    return (
      <button ref={ref} type={type ?? "button"} className={classes} {...rest} />
    );
  },
);
