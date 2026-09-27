"use client";

/**
 * The editor: rhythm gutter, text and margin notes. In "app" mode it checks as
 * you type and responds to the keyboard map; in "demo" mode, used on the
 * landing page, it shows fixed sample notes and never takes global shortcuts.
 * Each instance has its own notes store.
 */

import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import type { Category } from "@/types/suggestion";
import type { VoiceProfile } from "@/lib/voice/profile";
import {
  createNotesStore,
  NotesContext,
  openNotes,
  useNotesStore,
  type CheckStatus,
} from "./notes-store";
import { useDocEditor } from "./use-doc-editor";
import { useMarkSync } from "./use-mark-sync";
import { useChecking, type CheckOptions } from "./use-checking";
import { useSampleNotes } from "./use-sample-notes";
import { useResolve, type ResolveHandlers } from "./use-resolve";
import { useNoteKeys } from "./use-note-keys";
import { DocHeader } from "./DocHeader";
import { MarginNotes } from "./MarginNotes";
import { RhythmGutter } from "./RhythmGutter";
import styles from "./Editor.module.css";

export interface EditorControls {
  next: () => void;
  acceptAll: (category: Category) => number;
  activateRule: (ruleId: string) => boolean;
  focus: () => void;
}

interface EditorProps extends ResolveHandlers {
  mode: "app" | "demo";
  content: JSONContent;
  title: string;
  onTitleChange?: (title: string) => void;
  meta?: ReactNode;
  rhythm: boolean;
  onToggleRhythm?: () => void;
  check?: CheckOptions;
  sampleProfile?: VoiceProfile;
  onChange?: (content: JSONContent) => void;
  onNotes?: (open: number) => void;
  onStatus?: (status: CheckStatus) => void;
  controls?: Ref<EditorControls>;
}

export function Editor(props: EditorProps) {
  const [store] = useState(createNotesStore);
  return (
    <NotesContext.Provider value={store}>
      <EditorBody {...props} />
    </NotesContext.Provider>
  );
}

function AppChecks({
  editor,
  options,
}: {
  editor: TiptapEditor | null;
  options: CheckOptions;
}) {
  useChecking(editor, options);
  return null;
}

function SampleChecks({
  editor,
  profile,
}: {
  editor: TiptapEditor | null;
  profile?: VoiceProfile;
}) {
  useSampleNotes(editor, profile);
  return null;
}

function EditorBody(props: EditorProps) {
  const {
    mode,
    content,
    title,
    onTitleChange,
    meta,
    rhythm,
    onToggleRhythm,
    check,
    sampleProfile,
  } = props;
  const store = useNotesStore();
  const editor = useDocEditor(
    store,
    content,
    mode === "demo" ? "Sample draft" : "Draft text",
  );
  useMarkSync(editor);

  const handlers = useMemo<ResolveHandlers>(
    () => ({ onAccept: props.onAccept, onStet: props.onStet }),
    [props.onAccept, props.onStet],
  );
  const { accept, stet, step } = useResolve(editor, handlers);
  useNoteKeys(editor, mode === "app", {
    step,
    accept,
    stet,
    toggleRhythm: onToggleRhythm,
  });

  const callbacks = useRef(props);
  useEffect(() => {
    callbacks.current = props;
  });

  // The first note is active when a draft opens, so J, Enter and S work at once.
  useEffect(() => {
    let started = false;
    return store.subscribe((state, prev) => {
      const open = openNotes(state);
      if (!started && open.length > 0 && !state.activeId) {
        started = true;
        state.setActive(open[0]?.id ?? null);
      }
      if (state.byId !== prev.byId || state.goneIds !== prev.goneIds)
        callbacks.current.onNotes?.(open.length);
      if (state.status !== prev.status)
        callbacks.current.onStatus?.(state.status);
    });
  }, [store]);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => callbacks.current.onChange?.(editor.getJSON());
    const onClick = (event: MouseEvent) => {
      const mark = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-suggestion-id]",
      );
      if (mark?.dataset.suggestionId)
        store.getState().setActive(mark.dataset.suggestionId);
    };
    editor.on("update", onUpdate);
    editor.view.dom.addEventListener("click", onClick);
    return () => {
      editor.off("update", onUpdate);
      editor.view.dom.removeEventListener("click", onClick);
    };
  }, [editor, store]);

  useImperativeHandle(
    props.controls,
    () => ({
      next: () => void step(1),
      acceptAll: (category) => {
        const targets = openNotes(store.getState()).filter(
          (s) => s.category === category && s.replacements[0] !== undefined,
        );
        // Right to left, so each edit leaves the earlier positions untouched.
        [...targets]
          .reverse()
          .forEach((s, i) => window.setTimeout(() => accept(s.id), i * 40));
        return targets.length;
      },
      activateRule: (ruleId) => {
        const note = openNotes(store.getState()).find(
          (s) => s.ruleId === ruleId,
        );
        if (note) store.getState().setActive(note.id);
        return Boolean(note);
      },
      focus: () => editor?.commands.focus(),
    }),
    [step, accept, store, editor],
  );

  return (
    <div className={styles.sheet}>
      <RhythmGutter editor={editor} visible={rhythm} />
      <article className={styles.doc}>
        <DocHeader
          title={title}
          onTitleChange={onTitleChange}
          meta={meta}
          onDone={() => editor?.commands.focus("start")}
        />
        <EditorContent editor={editor} className={styles.body} />
      </article>
      <MarginNotes editor={editor} onAccept={accept} onStet={stet} />
      {mode === "app" && check ? (
        <AppChecks editor={editor} options={check} />
      ) : null}
      {mode === "demo" ? (
        <SampleChecks editor={editor} profile={sampleProfile} />
      ) : null}
    </div>
  );
}
