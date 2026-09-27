"use client";

/**
 * "Sounds like you" meter. Clicking it opens a short list of the biggest
 * differences from the writer's usual habits.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { VoiceReading } from "@/lib/voice/meter";
import { Chip, ChipLabel, ChipNumber } from "./TopBar";
import styles from "./VoiceMeter.module.css";

interface VoiceMeterProps {
  reading: VoiceReading | null;
  basis: string;
  addHref?: string;
}

export function VoiceMeter({ reading, basis, addHref }: VoiceMeterProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (
        event instanceof MouseEvent &&
        wrapRef.current?.contains(event.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!reading) {
    return addHref ? (
      <Link href={addHref} className={styles.add}>
        <ChipLabel>Sounds like you</ChipLabel>
        <span>Add writing</span>
      </Link>
    ) : null;
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <Chip
        on={open}
        onClick={() => setOpen((value) => !value)}
        title="How close this draft is to your usual voice"
        aria-expanded={open}
        aria-label={`Sounds like you, ${reading.score} percent`}
      >
        <ChipLabel>Sounds like you</ChipLabel>
        <span className={styles.track} aria-hidden="true">
          <i style={{ width: `${reading.score}%` }} />
        </span>
        <ChipNumber>{reading.score}%</ChipNumber>
      </Chip>
      {open ? (
        <div className={styles.pop} role="dialog" aria-label="Sounds like you">
          <p className={styles.basis}>{basis}</p>
          {reading.differences.length > 0 ? (
            <ul className={styles.list}>
              {reading.differences.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.same}>This draft sounds like you.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
