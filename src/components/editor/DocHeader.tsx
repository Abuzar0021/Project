"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "./Editor.module.css";

interface DocHeaderProps {
  title: string;
  onTitleChange?: (title: string) => void;
  onDone: () => void;
  meta?: ReactNode;
}

export function DocHeader({
  title,
  onTitleChange,
  onDone,
  meta,
}: DocHeaderProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  return (
    <header className={styles.header}>
      <textarea
        ref={ref}
        className={styles.title}
        value={title}
        rows={1}
        placeholder="Untitled"
        aria-label="Draft title"
        readOnly={!onTitleChange}
        onChange={(event) =>
          onTitleChange?.(event.target.value.replace(/\n/g, ""))
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onDone();
          }
        }}
      />
      {meta ? <div className={styles.meta}>{meta}</div> : null}
    </header>
  );
}
