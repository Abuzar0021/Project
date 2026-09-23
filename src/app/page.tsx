/**
 * Home page: mounts the editor shell.
 * The shell is a client component (it owns the TipTap editor and browser
 * storage); this server component just renders it as the whole page.
 */
import { EditorShell } from "@/components/editor/EditorShell";

export default function Home() {
  return <EditorShell />;
}
