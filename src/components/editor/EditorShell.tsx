/**
 * EditorShell: the client root of the writing experience.
 * Creates the TipTap editor, loads the saved draft (or the sample) on first
 * mount, keeps the word count and status in sync, autosaves to localStorage
 * (debounced 500ms), and lays out the top bar, the reserved minimap strip, the
 * centered sheet, and the reserved margin rail per DESIGN.md section 7. The rail
 * and minimap are empty this phase; they gain content in later phases.
 */
"use client";

import { useCallback, useEffect, useRef } from "react";
import { EditorContent } from "@tiptap/react";
import { useMarginEditor } from "./use-margin-editor";
import { useChecking } from "./use-checking";
import { useSuggestionDecorations } from "./use-suggestion-decorations";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";
import { useMarkClicks } from "@/components/card/use-mark-clicks";
import { useMarkHover } from "@/components/card/use-mark-hover";
import { SuggestionCard } from "@/components/card/SuggestionCard";
import { MarginRail } from "@/components/rail/MarginRail";
import { IssueMinimap } from "@/components/minimap/IssueMinimap";
import { Toast } from "@/components/ui/Toast";
import { TopBar } from "./TopBar";
import { useEditorUI } from "@/store/editor-ui";
import { SAMPLE_DOC, DEFAULT_TITLE } from "@/lib/editor/sample-doc";
import { loadDraft, saveDraft, clearDraft } from "@/lib/storage/doc-storage";
import { countWords } from "@/lib/text/word-count";
import styles from "./EditorShell.module.css";

const AUTOSAVE_DELAY_MS = 500;

export function EditorShell() {
  const editor = useMarginEditor();
  const { runCheck } = useChecking(editor);
  useSuggestionDecorations(editor);
  useMarkClicks(editor);
  useMarkHover(editor);
  useKeyboardShortcuts(editor);
  const setTitle = useEditorUI((s) => s.setTitle);
  const setWordCount = useEditorUI((s) => s.setWordCount);
  const setPlainText = useEditorUI((s) => s.setPlainText);
  const title = useEditorUI((s) => s.title);

  const initedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Debounced save of the current document and title. Reads the title from the
  // store at fire time so a title edit and a text edit share one timer.
  const scheduleSave = useCallback(() => {
    if (!editor) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraft({
        doc: editor.getJSON(),
        title: useEditorUI.getState().title,
      });
    }, AUTOSAVE_DELAY_MS);
  }, [editor]);

  // First mount: populate from storage or the sample. emitUpdate is false so we
  // do not immediately re-save; block ids are still assigned by the extension.
  useEffect(() => {
    if (!editor || initedRef.current) return;
    initedRef.current = true;

    const draft = loadDraft();
    if (draft) {
      editor.commands.setContent(draft.doc, false);
      setTitle(draft.title || DEFAULT_TITLE);
    } else {
      editor.commands.setContent(SAMPLE_DOC, false);
      setTitle(DEFAULT_TITLE);
    }

    const text = editor.getText();
    setWordCount(countWords(text));
    setPlainText(text);
    // The initial load uses emitUpdate=false, so kick off checking explicitly.
    runCheck();
  }, [editor, setTitle, setWordCount, setPlainText, runCheck]);

  // Keep the word count live and autosave on every document change. Checking is
  // driven by its own update listener inside useChecking.
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      const text = editor.getText();
      setWordCount(countWords(text));
      setPlainText(text);
      scheduleSave();
    };
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor, setWordCount, setPlainText, scheduleSave]);

  // Autosave when only the title changes (no document edit fired).
  useEffect(() => {
    if (!editor || !initedRef.current) return;
    scheduleSave();
  }, [title, editor, scheduleSave]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const onNewDraft = useCallback(() => {
    if (!editor) return;
    // clearContent emits an update, which drives useChecking and the word count.
    editor.commands.clearContent(true);
    clearDraft();
    setTitle(DEFAULT_TITLE);
    editor.commands.focus();
  }, [editor, setTitle]);

  return (
    <div className={styles.app}>
      <TopBar onNewDraft={onNewDraft} />
      <div
        className={styles.workspace}
        ref={workspaceRef}
        data-testid="workspace"
      >
        <IssueMinimap editor={editor} scrollRef={workspaceRef} />
        <div className={styles.canvas}>
          <div className={styles.sheet}>
            <EditorContent editor={editor} className={styles.editor} />
          </div>
          <MarginRail editor={editor} />
        </div>
      </div>
      <SuggestionCard editor={editor} />
      <Toast />
    </div>
  );
}
