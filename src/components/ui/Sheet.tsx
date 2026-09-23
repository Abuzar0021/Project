/**
 * Sheet: a bottom sheet used on mobile for the suggestion card and score panel.
 * It renders in a portal with a scrim, traps nothing heavier than an Escape
 * handler and outside-press to close, and animates up from the bottom. Content
 * is passed as children so each caller keeps its own layout.
 */
"use client";

import { useEffect, type ReactNode } from "react";
import { FloatingPortal } from "@floating-ui/react";
import styles from "./Sheet.module.css";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, label, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <FloatingPortal>
      <div className={styles.scrim} onMouseDown={onClose} aria-hidden="true" />
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </div>
    </FloatingPortal>
  );
}
