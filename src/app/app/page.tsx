/**
 * Editor page (/app): mounts the editor shell.
 * The shell is a client component (it owns the TipTap editor and browser
 * storage); this server component just renders it as the whole page. The
 * marketing page lives at / (DESIGN 14).
 */
import type { Metadata } from "next";
import { EditorShell } from "@/components/editor/EditorShell";

export const metadata: Metadata = {
  title: "Margin editor",
};

export default function EditorPage() {
  return <EditorShell />;
}
