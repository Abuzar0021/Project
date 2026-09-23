/**
 * StatusIndicator: the small checker-status text in the top bar (DESIGN 8.6).
 * Copy is exact per the spec. "Checking..." only appears once a check has been
 * running for more than 400ms, so quick checks never flash it. An empty document
 * shows nothing.
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
  if (status === "idle") text = "All checked";
  else if (status === "checking") text = showChecking ? "Checking..." : "";
  else if (status === "unreachable") text = UNREACHABLE_COPY;

  return (
    <span className={styles.status} aria-live="polite">
      {text}
    </span>
  );
}
