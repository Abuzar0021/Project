"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Editor, type EditorControls } from "@/components/editor/Editor";
import { Sidebar } from "@/components/app/Sidebar";
import { TopBar, Chip, ChipLabel, ChipNumber } from "@/components/app/TopBar";
import { StatusBar } from "@/components/app/StatusBar";
import { VoiceMeter } from "@/components/app/VoiceMeter";
import { CommandMenu } from "@/components/app/CommandMenu";
import { RhythmIcon, ThemeIcon } from "@/components/app/icons";
import { PRICING_UPDATE, SEED_DRAFTS } from "@/lib/seed-drafts";
import { docText, paragraphsToDoc } from "@/lib/drafts";
import { profileFromTexts } from "@/lib/voice/profile";
import { readVoice } from "@/lib/voice/meter";
import { measure } from "@/lib/voice/features";
import { countWords, readMinutes } from "@/lib/text/word-count";
import styles from "./DemoFrame.module.css";

// The sample account "writes" the other seed drafts, and has 41 of them.
const SAMPLE_PROFILE = profileFromTexts(
  SEED_DRAFTS.filter((d) => d !== PRICING_UPDATE).map((d) =>
    d.paragraphs.join("\n"),
  ),
  41,
);
const START_TEXT = PRICING_UPDATE.paragraphs.join("\n");

export function DemoFrame() {
  const router = useRouter();
  const [light, setLight] = useState(false);
  const [rhythm, setRhythm] = useState(true);
  const [notes, setNotes] = useState(5);
  const [text, setText] = useState(START_TEXT);
  const [commandOpen, setCommandOpen] = useState(false);
  const controls = useRef<EditorControls>(null);
  const content = useMemo(() => paragraphsToDoc(PRICING_UPDATE.paragraphs), []);
  const reading = useMemo(
    () => readVoice(SAMPLE_PROFILE.sample, measure(text)),
    [text],
  );
  const words = countWords(text);

  return (
    <div className={styles.frame}>
      <div
        className={`app ${styles.app}`}
        data-theme={light ? "light" : "dark"}
      >
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
              count: words.toLocaleString("en-US"),
              current: true,
            },
            { key: "memo", label: "Q4 board memo", count: "1,180" },
            { key: "hanna", label: "Reply to Hanna re: refund", count: "96" },
            { key: "onboarding", label: "Onboarding email 2", count: "230" },
          ]}
          tags={[
            { key: "customers", label: "# customers", count: "12" },
            { key: "launch", label: "# launch", count: "7" },
            { key: "internal", label: "# internal", count: "22" },
          ]}
          onSearch={() => setCommandOpen(true)}
        />
        <div className={styles.main}>
          <TopBar
            crumbs={
              <>
                All drafts / # customers / <b>Pricing update</b>
              </>
            }
            tools={
              <>
                <Chip
                  on={rhythm}
                  onClick={() => setRhythm((on) => !on)}
                  title="Sentence rhythm"
                >
                  <RhythmIcon />
                  <ChipLabel>Rhythm</ChipLabel>
                </Chip>
                <VoiceMeter
                  reading={reading}
                  basis="Based on 41 of your drafts"
                />
                <Chip
                  onClick={() => controls.current?.next()}
                  title="Go to the next note"
                >
                  <ChipNumber>{notes}</ChipNumber>
                  <ChipLabel>{notes === 1 ? "note" : "notes"}</ChipLabel>
                </Chip>
                <Chip
                  onClick={() => setLight((on) => !on)}
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
              mode="demo"
              content={content}
              title={PRICING_UPDATE.title}
              meta={
                <>
                  <span>Edited 4 min ago</span>
                  <span className={styles.tag}>#customers</span>
                  <span className={styles.tag}>#launch</span>
                </>
              }
              rhythm={rhythm}
              sampleProfile={SAMPLE_PROFILE}
              onChange={(next) => setText(docText(next))}
              onNotes={setNotes}
              controls={controls}
            />
          </div>
          <StatusBar words={words} minutes={readMinutes(words)} save="Saved" />
        </div>
        <CommandMenu
          open={commandOpen}
          onOpenChange={setCommandOpen}
          commands={[
            {
              id: "next",
              group: "This draft",
              label: "Next note",
              hint: "J",
              run: () => controls.current?.next(),
            },
            {
              id: "rhythm",
              group: "View",
              label: "Toggle sentence rhythm",
              hint: "R",
              run: () => setRhythm((on) => !on),
            },
            {
              id: "theme",
              group: "View",
              label: `Switch to ${light ? "dark" : "light"}`,
              run: () => setLight((on) => !on),
            },
            {
              id: "pricing",
              group: "Go to",
              label: "Pricing",
              run: () => router.push("/pricing"),
            },
            {
              id: "signup",
              group: "Go to",
              label: "Sign up",
              run: () => router.push("/signup"),
            },
          ]}
        />
      </div>
    </div>
  );
}
