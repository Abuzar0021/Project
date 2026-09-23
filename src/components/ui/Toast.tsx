/**
 * Toast: the single transient message, announced politely to screen readers.
 * It reads from the toast store, auto-hides after a few seconds, and can show one
 * action (Undo). The live region stays mounted so announcements are reliably
 * read; only the visible pill comes and goes.
 */
"use client";

import { useEffect } from "react";
import { useToast } from "@/store/toast";
import styles from "./Toast.module.css";

const AUTO_HIDE_MS = 5000;

export function Toast() {
  const message = useToast((s) => s.message);
  const action = useToast((s) => s.action);
  const nonce = useToast((s) => s.nonce);
  const hide = useToast((s) => s.hide);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
    // nonce changes on every show(), so repeat messages reset the timer.
  }, [message, nonce, hide]);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {message ? (
        <div className={styles.toast}>
          <span className={styles.message}>{message}</span>
          {action ? (
            <button
              type="button"
              className={styles.action}
              onClick={() => {
                action.run();
                hide();
              }}
            >
              {action.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
