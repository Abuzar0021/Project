"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { editedAgo } from "@/lib/drafts";
import { FREE_DRAFT_LIMIT } from "@/lib/entitlements";
import { useApp } from "./AppContext";
import { useShell } from "./AppShell";
import { TopBar } from "./TopBar";
import { PlusIcon } from "./icons";
import styles from "./Page.module.css";

export function DraftList() {
  const params = useSearchParams();
  const tag = params.get("tag");
  const full = params.get("full") === "1";
  const { drafts, newDraft } = useApp();
  const { openSidebar } = useShell();
  const shown = tag ? drafts.filter((d) => d.tags.includes(tag)) : drafts;

  return (
    <>
      <TopBar
        onMenu={openSidebar}
        crumbs={
          tag ? (
            <>
              <Link href="/app/drafts">All drafts</Link> / <b># {tag}</b>
            </>
          ) : (
            <b>All drafts</b>
          )
        }
      />
      <div className={styles.scroll}>
        <div className={styles.page}>
          <div className={styles.head}>
            <h1 className={styles.title}>{tag ? `# ${tag}` : "All drafts"}</h1>
            <button type="button" className={styles.action} onClick={newDraft}>
              <PlusIcon /> New draft
            </button>
          </div>

          {full ? (
            <p className={styles.notice}>
              The Free plan holds {FREE_DRAFT_LIMIT} drafts. Delete one to start
              another, or <Link href="/app/settings#plan">move to Pro</Link> for
              unlimited drafts.
            </p>
          ) : null}

          {shown.length === 0 ? (
            <p className={styles.empty}>No drafts here yet.</p>
          ) : (
            <ul className={styles.rows}>
              {shown.map((draft) => (
                <li key={draft.id}>
                  <Link href={`/app/d/${draft.id}`} className={styles.row}>
                    <span className={styles.rowTitle}>
                      {draft.title || "Untitled"}
                    </span>
                    <span className={styles.rowMeta}>
                      {draft.tags.map((t) => `#${t}`).join(" ")}
                    </span>
                    <span className={styles.rowMeta}>
                      {editedAgo(draft.updatedAt)}
                    </span>
                    <span className={styles.rowCount}>
                      {draft.words.toLocaleString("en-US")} words
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
