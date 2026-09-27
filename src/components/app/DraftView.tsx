"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import type { Suggestion } from "@/types/suggestion";
import { Editor, type EditorControls } from "@/components/editor/Editor";
import type { CheckStatus } from "@/components/editor/notes-store";
import type { StetResult } from "@/components/editor/use-resolve";
import {
  deleteDraft,
  docText,
  editedAgo,
  getDraft,
  saveDraft,
  type Draft,
} from "@/lib/drafts";
import { addStet, listStet, removeStet } from "@/lib/stet";
import { getPrefs, setPrefs } from "@/lib/prefs";
import { buildProfile } from "@/lib/voice/profile";
import { readVoice } from "@/lib/voice/meter";
import { measure } from "@/lib/voice/features";
import { countWords, readMinutes } from "@/lib/text/word-count";
import { useApp } from "./AppContext";
import { useShell } from "./AppShell";
import { TopBar, Chip, ChipLabel, ChipNumber } from "./TopBar";
import { StatusBar } from "./StatusBar";
import { VoiceMeter } from "./VoiceMeter";
import { RhythmIcon, ThemeIcon } from "./icons";
import styles from "./DraftView.module.css";

const SAVE_MS = 800;

export function DraftView({ id }: { id: string }) {
  const router = useRouter();
  const {
    account,
    entitlements,
    drafts,
    refreshDrafts,
    setDraftCommands,
    toggleTheme,
  } = useApp();
  const { openSidebar } = useShell();
  const email = account.email;

  const [draft, setDraft] = useState<Draft | null | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [save, setSave] = useState("Saved");
  const [notes, setNotes] = useState(0);
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [kept, setKept] = useState(() => listStet(email));
  const [rhythm, setRhythm] = useState(() => getPrefs(email).rhythm);
  const controls = useRef<EditorControls>(null);
  const saveTimer = useRef(0);

  useEffect(() => {
    const found = getDraft(email, id);
    setDraft(found);
    setTitle(found?.title ?? "");
    setText(found ? docText(found.content) : "");
  }, [email, id]);

  const persist = useCallback(
    (patch: { title?: string; content?: JSONContent }) => {
      setSave(
        navigator.onLine ? "Saving" : "Offline, changes kept on this device",
      );
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        const saved = saveDraft(email, id, patch);
        if (saved) setDraft(saved);
        refreshDrafts();
        setSave(
          navigator.onLine ? "Saved" : "Offline, changes kept on this device",
        );
      }, SAVE_MS);
    },
    [email, id, refreshDrafts],
  );

  const pending = useRef<{ title?: string; content?: JSONContent }>({});
  const queue = useCallback(
    (patch: { title?: string; content?: JSONContent }) => {
      pending.current = { ...pending.current, ...patch };
      persist(pending.current);
    },
    [persist],
  );

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  // Rebuild the profile only when another draft changes, not on every save of this one.
  const othersKey = drafts
    .filter((d) => d.id !== id)
    .map((d) => `${d.id}:${d.updatedAt}`)
    .join("|");
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  const profile = useMemo(
    () =>
      entitlements.voice ? buildProfile(email, draftsRef.current, id) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- othersKey stands in for the drafts list
    [entitlements.voice, email, id, othersKey],
  );
  const reading = useMemo(
    () =>
      profile && countWords(text) > 0
        ? readVoice(profile.sample, measure(text))
        : null,
    [profile, text],
  );

  const check = useMemo(
    () => ({ draftId: id, categories: entitlements.categories, profile, kept }),
    [id, entitlements.categories, profile, kept],
  );

  const onStet = useCallback(
    (s: Suggestion): StetResult => {
      const rule = addStet(email, {
        ruleId: s.ruleId,
        original: s.original,
        scope: entitlements.stetScope,
        draftId: id,
      });
      setKept(listStet(email));
      return {
        scope: entitlements.stetScope,
        undo: () => {
          removeStet(email, rule.id);
          setKept(listStet(email));
        },
      };
    },
    [email, entitlements.stetScope, id],
  );

  const toggleRhythm = useCallback(() => {
    if (!entitlements.rhythm) return;
    setRhythm((on) => setPrefs(email, { rhythm: !on }).rhythm);
  }, [email, entitlements.rhythm]);

  useEffect(() => {
    setDraftCommands([
      {
        id: "next",
        group: "This draft",
        label: "Next note",
        hint: "J",
        run: () => controls.current?.next(),
      },
      {
        id: "accept-spelling",
        group: "This draft",
        label: "Accept all spelling notes",
        run: () => controls.current?.acceptAll("spelling"),
      },
      ...(entitlements.rhythm
        ? [
            {
              id: "rhythm",
              group: "This draft",
              label: "Toggle sentence rhythm",
              hint: "R",
              run: toggleRhythm,
            },
          ]
        : []),
      {
        id: "long",
        group: "This draft",
        label: "Show long sentences",
        run: () => controls.current?.activateRule("local:long-sentence"),
      },
      {
        id: "delete",
        group: "This draft",
        label: "Delete this draft",
        run: () => {
          if (
            !window.confirm(
              "Delete this draft? It's removed from this device right away.",
            )
          )
            return;
          deleteDraft(email, id);
          refreshDrafts();
          router.push("/app");
        },
      },
    ]);
    return () => setDraftCommands([]);
  }, [
    setDraftCommands,
    entitlements.rhythm,
    toggleRhythm,
    email,
    id,
    refreshDrafts,
    router,
  ]);

  if (draft === undefined) return <div className={styles.loading} />;

  if (draft === null) {
    return (
      <>
        <TopBar
          onMenu={openSidebar}
          crumbs={<Link href="/app/drafts">All drafts</Link>}
        />
        <div className={styles.missing}>
          <p>This draft isn&rsquo;t here anymore. It may have been deleted.</p>
          <Link href="/app/drafts">Go to all drafts</Link>
        </div>
      </>
    );
  }

  const tag = draft.tags[0];
  const words = countWords(text);
  const basis = profile
    ? `Based on ${profile.count} of your ${profile.uploads > 0 ? "drafts and uploads" : "drafts"}`
    : "";

  return (
    <>
      <TopBar
        onMenu={openSidebar}
        crumbs={
          <>
            <Link href="/app/drafts">All drafts</Link> /{" "}
            {tag ? (
              <>
                <Link href={`/app/drafts?tag=${encodeURIComponent(tag)}`}>
                  # {tag}
                </Link>{" "}
                /{" "}
              </>
            ) : null}
            <b>{title || "Untitled"}</b>
          </>
        }
        tools={
          <>
            {entitlements.rhythm ? (
              <Chip
                on={rhythm}
                onClick={toggleRhythm}
                title="Sentence rhythm (R)"
              >
                <RhythmIcon />
                <ChipLabel>Rhythm</ChipLabel>
              </Chip>
            ) : null}
            {entitlements.voice ? (
              <VoiceMeter reading={reading} basis={basis} addHref="/welcome" />
            ) : null}
            <Chip
              onClick={() => controls.current?.next()}
              title="Go to the next note"
            >
              <ChipNumber>{notes}</ChipNumber>
              <ChipLabel>{notes === 1 ? "note" : "notes"}</ChipLabel>
            </Chip>
            <Chip
              onClick={toggleTheme}
              title="Light or dark"
              aria-label="Switch light or dark"
            >
              <ThemeIcon />
            </Chip>
          </>
        }
      />
      <div className={styles.scroll}>
        <Editor
          key={draft.id}
          mode="app"
          content={draft.content}
          title={title}
          onTitleChange={(next) => {
            setTitle(next);
            queue({ title: next });
          }}
          meta={
            <>
              <span>{editedAgo(draft.updatedAt)}</span>
              {draft.tags.map((t) => (
                <span key={t} className={styles.tag}>
                  #{t}
                </span>
              ))}
            </>
          }
          rhythm={entitlements.rhythm && rhythm}
          onToggleRhythm={toggleRhythm}
          check={check}
          onStet={onStet}
          onChange={(content) => {
            setText(docText(content));
            queue({ content });
          }}
          onNotes={setNotes}
          onStatus={setStatus}
          controls={controls}
        />
      </div>
      <StatusBar
        words={words}
        minutes={readMinutes(words)}
        save={save}
        paused={status === "unreachable"}
      />
    </>
  );
}
