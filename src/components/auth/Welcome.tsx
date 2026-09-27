"use client";

/**
 * Onboarding upload. Files are read in the browser, measured for the voice
 * profile, and dropped; only the measurements are kept.
 */

import Link from "next/link";
import { useEffect, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { currentAccount, logOut, updateAccount } from "@/lib/account";
import { addUploadedText } from "@/lib/voice/profile";
import { ACCEPTED, readWriting } from "@/lib/voice/read-file";
import { ButtonLink } from "@/components/ui/Button";
import styles from "./Auth.module.css";

interface Upload {
  key: string;
  name: string;
  state: "reading" | "added" | "failed";
}

const MIN_WORDS = 20;

export function Welcome() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [over, setOver] = useState(false);

  useEffect(() => {
    const account = currentAccount();
    if (!account) {
      logOut();
      router.replace("/login");
      return;
    }
    setEmail(account.email);
    updateAccount({ onboarded: true });
  }, [router]);

  const add = (files: FileList | null) => {
    if (!files || !email) return;
    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      setUploads((list) => [
        ...list,
        { key, name: file.name, state: "reading" },
      ]);
      readWriting(file)
        .then((text) => {
          if (text.trim().split(/\s+/).length < MIN_WORDS)
            throw new Error("Too short");
          addUploadedText(email, text);
          return "added" as const;
        })
        .catch(() => "failed" as const)
        .then((state) =>
          setUploads((list) =>
            list.map((u) => (u.key === key ? { ...u, state } : u)),
          ),
        );
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    add(event.dataTransfer.files);
  };

  return (
    <div className={`${styles.box} ${styles.wide}`}>
      <div className={styles.steps} aria-label="Step 2 of 3">
        <i className={styles.on} />
        <i className={styles.on} />
        <i />
      </div>
      <h1 className={styles.title}>Teach Margin how you write</h1>
      <p className={styles.muted}>
        Add a few things you&rsquo;ve written before: emails, posts, docs. Three
        is enough to start. Margin uses them for your voice profile only, and
        keeps the measurements, never the text.
      </p>

      <label
        className={`${styles.drop} ${over ? styles.over : ""}`}
        htmlFor="upload"
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <b>Drop files here or choose files</b>
        <span className={styles.small}>.txt, .md or .docx</span>
        <input
          id="upload"
          type="file"
          multiple
          accept={ACCEPTED}
          className="sr-only"
          onChange={(event) => {
            add(event.target.files);
            event.target.value = "";
          }}
        />
      </label>

      {uploads.length > 0 ? (
        <ul className={styles.files} aria-live="polite">
          {uploads.map((upload) => (
            <li key={upload.key}>
              <span className={styles.fileName}>{upload.name}</span>
              {upload.state === "added" ? (
                <span className={styles.added}>Added</span>
              ) : null}
              {upload.state === "reading" ? <span>Reading</span> : null}
              {upload.state === "failed" ? (
                <span className={styles.failed}>
                  Couldn&rsquo;t read this file
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <ButtonLink variant="primary" block href="/app">
        Continue to editor
      </ButtonLink>
      <p className={styles.small}>
        <Link href="/app">Skip for now</Link>. You can add writing later in
        Settings.
      </p>
    </div>
  );
}
