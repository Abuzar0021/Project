"use client";

/**
 * The Margin app as the film shows it: the real sidebar, top bar, status bar
 * and editor styles, on the sample draft from the prototype. Nothing here is
 * interactive; the timeline animates it. Every part the film touches has a
 * data-f name.
 *
 * Once fonts are ready it measures itself, places the notes beside their
 * underlines with the product's own layout rules, and draws the rhythm bars.
 */

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Sidebar } from "@/components/app/Sidebar";
import { TopBar, Chip, ChipLabel, ChipNumber } from "@/components/app/TopBar";
import { StatusBar } from "@/components/app/StatusBar";
import { RhythmIcon, ThemeIcon } from "@/components/app/icons";
import { layoutNotes } from "@/lib/notes-layout";
import { barLabel, barWidth, LONG_RHYTHM_WORDS } from "@/lib/rhythm";
import editor from "@/components/editor/Editor.module.css";
import meter from "@/components/app/VoiceMeter.module.css";
import { offsetWithin } from "./motion";
import { FilmNote, type FilmNoteData } from "./FilmNote";
import styles from "./Film.module.css";

/** The note Stet memory remembers; it shows up again in the second draft. */
const PLAINER: FilmNoteData = {
  id: "plainer",
  category: "clarity",
  label: "Plainer word",
  from: "utilize",
  to: "use",
  reason:
    "“Use” does the same job. Stet this if the formal word is on purpose.",
};

export const NOTES: FilmNoteData[] = [
  {
    id: "passive",
    category: "clarity",
    label: "Passive voice",
    from: "was decided by the team",
    to: "the team decided",
    reason:
      "Say who decided. Readers trust a decision more when someone owns it.",
  },
  {
    id: "wordy",
    category: "clarity",
    label: "Wordy",
    from: "in order to",
    to: "to",
    reason: "Same meaning, two fewer words.",
  },
  {
    id: "spelling",
    category: "spelling",
    label: "Spelling",
    from: "recieve",
    to: "receive",
    reason: "I before E, except in this one.",
  },
  PLAINER,
  {
    id: "voice",
    category: "voice",
    label: "Not your voice",
    from: "We shall",
    to: "We’ll",
    reason: "Across your 41 drafts you write “we’ll”, never “we shall”.",
  },
];

/** An underlined phrase that the film can strike through and replace. */
function Fix({
  id,
  category,
  from,
  to,
}: {
  id: string;
  category: "spelling" | "clarity" | "voice";
  from: string;
  to?: string;
}) {
  return (
    <>
      <span
        className={`mark mark-${category} ${styles.markHost}`}
        data-f={`mark-${id}`}
      >
        {from}
        <i className={styles.strike} data-f={`strike-${id}`} />
      </span>
      {to ? (
        <span className={styles.swapIn} data-f={`new-${id}`}>
          {to}
        </span>
      ) : null}
    </>
  );
}

/** A sentence the rhythm gutter draws a bar for. */
function S({ children }: { children: ReactNode }) {
  return (
    <span className={styles.sentence} data-f="sentence">
      {children}
    </span>
  );
}

/**
 * Words in a sentence as the film shows it by the time the rhythm scene
 * plays: accepted notes read as their replacements.
 */
function visibleWords(sentence: HTMLElement): number {
  const copy = sentence.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[data-f^="old-"]').forEach((el) => el.remove());
  copy.querySelectorAll<HTMLElement>('[data-f^="mark-"]').forEach((mark) => {
    const next = mark.nextElementSibling as HTMLElement | null;
    if (next?.dataset.f?.startsWith("new-")) mark.remove();
  });
  return (copy.textContent ?? "").trim().split(/\s+/).length;
}

/** Lay the draft out as it reads with every replacement applied. */
function showEdits(doc: HTMLElement): { undo: () => void } {
  const hide = Array.from(
    doc.querySelectorAll<HTMLElement>('[data-f^="old-"], [data-f^="mark-"]'),
  ).filter((el) => {
    if (el.dataset.f?.startsWith("old-")) return true;
    const next = el.nextElementSibling as HTMLElement | null;
    return next?.dataset.f?.startsWith("new-") ?? false;
  });
  const show = Array.from(
    doc.querySelectorAll<HTMLElement>('[data-f^="new-"]'),
  );
  hide.forEach((el) => (el.style.display = "none"));
  show.forEach((el) => (el.style.display = "inline"));
  return {
    undo: () => {
      hide.forEach((el) => (el.style.display = ""));
      show.forEach((el) => (el.style.display = ""));
    },
  };
}

interface Bar {
  top: number;
  width: number;
  long: boolean;
  words: number;
}

export function FilmProduct({
  compact,
  onReady,
  children,
}: {
  compact: boolean;
  onReady: () => void;
  /** Film-only layers drawn over the app, moved by the same camera. */
  children?: ReactNode;
}) {
  const docRef = useRef<HTMLDivElement>(null);
  const [tops, setTops] = useState<Record<string, number>>({});
  const [bars, setBars] = useState<Bar[]>([]);
  const longWords = bars.find((bar) => bar.long)?.words ?? 0;
  const [measures, setMeasures] = useState(0);

  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      const doc = docRef.current;
      if (!doc || cancelled) return;
      // Gutter, text and notes share one grid row, so all three measure from
      // the top of the article.
      const article = doc.closest("article");
      if (!article) return;
      const boxes = NOTES.map((note) => {
        const mark = doc.querySelector<HTMLElement>(
          `[data-f="mark-${note.id}"]`,
        );
        const anchor = mark ? offsetWithin(mark, article).y : 0;
        return { id: note.id, anchorTop: anchor, height: 58 };
      });
      setTops(Object.fromEntries(layoutNotes(boxes).map((b) => [b.id, b.top])));

      // Bars are drawn after the first edits are accepted, so they are
      // measured against the text as it reads by then, and put back after.
      const edits = showEdits(doc);
      const lineHeight = 17 * 1.75;
      setBars(
        Array.from(
          doc.querySelectorAll<HTMLElement>('[data-f="sentence"]'),
        ).map((sentence) => {
          const words = visibleWords(sentence);
          return {
            top: offsetWithin(sentence, article).y + lineHeight / 2 - 2,
            width: barWidth(words, 60),
            long: words > LONG_RHYTHM_WORDS,
            words,
          };
        }),
      );
      edits.undo();
      setMeasures((n) => n + 1);
    };
    void document.fonts.ready.then(measure);
    return () => {
      cancelled = true;
    };
  }, [compact]);

  useLayoutEffect(() => {
    if (measures > 0) onReady();
  }, [measures, onReady]);

  return (
    <div
      className={`${styles.frame} ${compact ? styles.frameCompact : ""}`}
      data-f="frame"
    >
      <div className={`app ${styles.app}`} data-theme="dark" data-f="app">
        {compact ? null : (
          <div className={styles.side} data-f="side">
            <Sidebar
              workspace="Northwind"
              userName="Mira Tan"
              initials="MT"
              primary={[
                { key: "inbox", label: "Inbox", count: "3" },
                { key: "all", label: "All drafts", count: "41" },
                { key: "shared", label: "Shared with me" },
              ]}
              recent={[
                {
                  key: "pricing",
                  label: "Pricing update",
                  count: "128",
                  current: true,
                },
                { key: "memo", label: "Q4 board memo", count: "1,180" },
                {
                  key: "hanna",
                  label: "Reply to Hanna re: refund",
                  count: "96",
                },
                {
                  key: "onboarding",
                  label: "Onboarding email 2",
                  count: "230",
                },
              ]}
              tags={[
                { key: "customers", label: "# customers", count: "12" },
                { key: "launch", label: "# launch", count: "7" },
                { key: "internal", label: "# internal", count: "22" },
              ]}
              onSearch={() => undefined}
            />
          </div>
        )}

        <div className={styles.main} data-f="main">
          <div data-f="topbar">
            <TopBar
              crumbs={
                <span className={styles.crumbs}>
                  <span data-f="crumb-a">
                    All drafts / # customers / <b>Pricing update</b>
                  </span>
                  <span className={styles.crumbNext} data-f="crumb-b">
                    All drafts / # internal / <b>Q4 board memo</b>
                  </span>
                </span>
              }
              tools={
                <>
                  <Chip on data-f="chip-rhythm" tabIndex={-1}>
                    <RhythmIcon />
                    <ChipLabel>Rhythm</ChipLabel>
                  </Chip>
                  <Chip data-f="chip-voice" tabIndex={-1}>
                    <ChipLabel>Sounds like you</ChipLabel>
                    <span className={meter.track}>
                      <i data-f="meter-fill" style={{ width: "86%" }} />
                    </span>
                    <ChipNumber>
                      <span data-f="meter-num">86</span>%
                    </ChipNumber>
                  </Chip>
                  <Chip data-f="chip-notes" tabIndex={-1}>
                    <ChipNumber>
                      <span data-f="count">5</span>
                    </ChipNumber>
                    <ChipLabel>
                      <span data-f="count-label">notes</span>
                    </ChipLabel>
                  </Chip>
                  <Chip tabIndex={-1}>
                    <ThemeIcon />
                  </Chip>
                </>
              }
            />
          </div>

          <div className={styles.viewport} data-f="viewport">
            <div className={styles.page} data-f="page-a">
              <div className={styles.sheet}>
                <div className={styles.gutter} data-f="gutter">
                  {bars.map((bar, i) => (
                    <i
                      key={i}
                      className={`${editor.bar} ${styles.bar}`}
                      data-f={bar.long ? "bar-long" : "bar"}
                      data-index={i}
                      style={{ top: bar.top, width: bar.width }}
                    />
                  ))}
                </div>

                <article className={styles.doc} data-f="doc">
                  <h1 className={styles.docTitle} data-f="doc-title">
                    Pricing update for early customers
                  </h1>
                  <div className={styles.docMeta} data-f="doc-meta">
                    <span>Edited 4 min ago</span>
                    <span>#customers</span>
                    <span>#launch</span>
                  </div>
                  <div className={editor.body} ref={docRef}>
                    <div className="ProseMirror">
                      <p data-f="para">
                        <S>
                          Starting next month, everyone who joined before March
                          will keep their current rate for a full year.
                        </S>{" "}
                        <S>
                          <span className={styles.swapOut} data-f="old-passive">
                            The new pricing{" "}
                            <Fix
                              id="passive"
                              category="clarity"
                              from="was decided by the team"
                            />
                          </span>
                          <span className={styles.swapIn} data-f="new-passive">
                            The team decided the new pricing
                          </span>{" "}
                          after three weeks of calls with people like you.
                        </S>{" "}
                        <S>We wanted to be clear about it early.</S>
                      </p>
                      <p data-f="para">
                        <S>
                          You don&rsquo;t need to do anything{" "}
                          <Fix
                            id="wordy"
                            category="clarity"
                            from="in order to"
                            to="to"
                          />{" "}
                          keep your rate, since it will be applied to your
                          account automatically and you will{" "}
                          <Fix
                            id="spelling"
                            category="spelling"
                            from="recieve"
                            to="receive"
                          />{" "}
                          a confirmation email once the change goes live, along
                          with a copy of your current invoice and a short note
                          explaining what changes for new customers after that
                          date.
                        </S>
                      </p>
                      <p data-f="para">
                        <S>
                          If you want to{" "}
                          <Fix id="plainer" category="clarity" from="utilize" />{" "}
                          the annual plan instead, reply to this email.
                        </S>{" "}
                        <S>
                          <Fix
                            id="voice"
                            category="voice"
                            from="We shall"
                            to="We&rsquo;ll"
                          />{" "}
                          be delighted to switch it for you.
                        </S>{" "}
                        <S>Thanks for being here early.</S>
                      </p>
                      <p data-f="para">
                        <S>Mira, for the Northwind team</S>
                      </p>
                    </div>
                  </div>
                </article>

                <div className={styles.notes} data-f="notes">
                  {NOTES.map((note) => (
                    <div
                      key={note.id}
                      className={styles.noteSlot}
                      style={{ top: tops[note.id] ?? 0 }}
                      data-f={`slot-${note.id}`}
                    >
                      <FilmNote note={note} />
                    </div>
                  ))}
                  <div
                    className={styles.memo}
                    style={{ top: tops.plainer ?? 0 }}
                    data-f="memo"
                  >
                    Kept. Margin won&rsquo;t flag <b>&ldquo;utilize&rdquo;</b>{" "}
                    again in any of your drafts.
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.page} data-f="page-b">
              <div className={styles.sheet}>
                <div className={styles.gutter} />
                <article className={styles.doc} data-f="doc-b">
                  <h1 className={styles.docTitle}>Q4 board memo</h1>
                  <div className={styles.docMeta}>
                    <span>Edited 3 hours ago</span>
                    <span>#internal</span>
                  </div>
                  <div className={editor.body}>
                    <div className="ProseMirror">
                      <p>
                        Here&rsquo;s where we landed this quarter. Revenue grew
                        eleven percent, churn held steady, and we&rsquo;re
                        finally seeing the annual plan pull its weight.
                      </p>
                      <p>
                        We&rsquo;d like to{" "}
                        <span
                          className={`mark mark-clarity ${styles.ghostMark}`}
                          data-f="ghost-mark"
                        >
                          utilize
                        </span>{" "}
                        the spring launch to bring the last few teams across.
                        We&rsquo;ll walk through the numbers on Thursday.
                      </p>
                    </div>
                  </div>
                </article>
                <div className={styles.notes}>
                  <div className={styles.ghostNote} data-f="ghost-note">
                    <FilmNote note={{ ...PLAINER, id: "ghost" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div data-f="status">
            <StatusBar words={128} minutes={1} save="Saved" />
          </div>
        </div>

        <div className={styles.memory} data-f="memory">
          <div className={styles.memoryHead}>Kept suggestions</div>
          <div className={styles.memoryRow} data-f="memory-row">
            <span>&ldquo;utilize&rdquo;</span>
            <span className={styles.memoryScope}>all drafts</span>
          </div>
        </div>

        <div className={styles.cmd} data-f="cmd">
          <div className={styles.cmdInput}>Type a command or search</div>
          <div className={styles.cmdHead}>This draft</div>
          <div className={`${styles.cmdItem} ${styles.cmdSel}`}>
            Next note<span className={styles.cmdKey}>J</span>
          </div>
          <div className={styles.cmdItem}>Accept all spelling notes</div>
          <div className={styles.cmdItem}>
            Toggle sentence rhythm<span className={styles.cmdKey}>R</span>
          </div>
          <div className={styles.cmdHead}>Go to</div>
          <div className={styles.cmdItem}>Q4 board memo</div>
        </div>

        <div className={styles.tip} data-f="tip">
          {barLabel(longWords)}
        </div>

        {children}
      </div>
    </div>
  );
}
