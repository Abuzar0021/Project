/**
 * StatusIndicator: the small checker-status text in the top bar (DESIGN 8.6).
 * "Checking..." only appears once a check has been running for more than 400ms,
 * so quick checks never flash it; "Checking paused..." shows when the checker is
 * unreachable. The idle "all checked" label from 8.6 is intentionally dropped
 * (Phase 9 declutter): it is persistent reassurance that says nothing actionable
 * and crowds the filter chips at tablet width, so only the states that ask the
 * writer to notice something are shown. An empty document shows nothing.
 */
"use client";

import { useEffect, useState } from "react";
import { useEditorUI } from "@/store/editor-ui";
import styles from "./StatusIndicator.module.css";

const UNREACHABLE_COPY =
  "Checking paused. Can't reach the checker, retrying in 10s.";

export function StatusIndicator() {
  const status = useEditorUI((s) => s.status);
  const [showChecking, setShowChecking] = useState(false);

  useEffect(() => {
    if (status !== "checking") {
      setShowChecking(false);
      return;
    }
    const timer = setTimeout(() => setShowChecking(true), 400);
    return () => clearTimeout(timer);
  }, [status]);

  let text = "";
  if (status === "checking") text = showChecking ? "Checking..." : "";
  else if (status === "unreachable") text = UNREACHABLE_COPY;

  return (
    <span className={styles.status} aria-live="polite">
      {text}
    </span>
  );
}
