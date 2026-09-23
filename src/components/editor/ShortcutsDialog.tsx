/**
 * ShortcutsDialog: the "Shortcuts" link in the top bar and the small sheet it
 * opens (DESIGN 10). A centered modal that lists the keyboard map. Escape and an
 * outside click close it, and focus moves into it on open.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { FloatingPortal } from "@floating-ui/react";
import { Button } from "@/components/ui/Button";
import styles from "./ShortcutsDialog.module.css";

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "Ctrl / Cmd + J", action: "Jump to next suggestion" },
  { keys: "Ctrl / Cmd + Shift + J", action: "Previous suggestion" },
  { keys: "Enter", action: "Apply the primary replacement (card open)" },
  { keys: "1, 2, 3", action: "Apply that replacement (card open)" },
  { keys: "D", action: "Dismiss (card open)" },
  { keys: "Esc", action: "Close the card" },
  { keys: "Ctrl / Cmd + Z", action: "Undo, including an applied fix" },
];

export function ShortcutsDialog() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Shortcuts
      </Button>

      {open ? (
        <FloatingPortal>
          <div
            className={styles.scrim}
            onMouseDown={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={dialogRef}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            tabIndex={-1}
          >
            <h2 className={styles.title}>Keyboard shortcuts</h2>
            <dl className={styles.list}>
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className={styles.row}>
                  <dt className={styles.keys}>{s.keys}</dt>
                  <dd className={styles.action}>{s.action}</dd>
                </div>
              ))}
            </dl>
            <div className={styles.footer}>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}
