"use client";

/**
 * Settings page. Plan changes arrive here from the pricing page as ?plan=,
 * and take effect without payment while billing is not connected.
 */

import Link from "next/link";
import { useReducer, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteAccount, type Theme } from "@/lib/account";
import { planById, TRIAL_DAYS, type Period, type PlanId } from "@/lib/plans";
import { listStet, removeStet } from "@/lib/stet";
import { buildProfile, resetUploads } from "@/lib/voice/profile";
import { useApp } from "./AppContext";
import { useShell } from "./AppShell";
import { TopBar } from "./TopBar";
import page from "./Page.module.css";
import styles from "./Settings.module.css";

const THEMES: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

export function Settings() {
  const router = useRouter();
  const params = useSearchParams();
  const { account, drafts, theme, setTheme, saveAccount, logout } = useApp();
  const { openSidebar } = useShell();
  const [name, setName] = useState(account.name);
  const [kept, setKept] = useState(() => listStet(account.email));
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [message, setMessage] = useState<string | null>(null);

  const plan = planById(account.plan);
  const requested = planById(params.get("plan"));
  const requestedPeriod: Period =
    params.get("period") === "monthly" ? "monthly" : "yearly";
  const profile = buildProfile(account.email, drafts);
  const titleOf = (id: string | null) =>
    drafts.find((d) => d.id === id)?.title || "Untitled";

  const choosePlan = (id: PlanId, period: Period) => {
    const trialEndsAt =
      id === "free"
        ? null
        : new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString();
    saveAccount({ plan: id, period, trialEndsAt });
    setMessage(
      id === "free"
        ? "You're on Free now."
        : `You're on ${planById(id)?.name} now.`,
    );
    router.replace("/app/settings");
  };

  return (
    <>
      <TopBar onMenu={openSidebar} crumbs={<b>Settings</b>} />
      <div className={page.scroll}>
        <div className={page.page}>
          <h1 className={page.title}>Settings</h1>
          {message ? (
            <p className={styles.message} role="status">
              {message}
            </p>
          ) : null}

          <section className={styles.section} aria-labelledby="account">
            <h2 id="account" className={styles.heading}>
              Account
            </h2>
            <label className={styles.row} htmlFor="settings-name">
              <span>Name</span>
              <input
                id="settings-name"
                className={styles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => name.trim() && saveAccount({ name: name.trim() })}
              />
            </label>
            <div className={styles.row}>
              <span>Email</span>
              <span className={styles.value}>{account.email}</span>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="appearance">
            <h2 id="appearance" className={styles.heading}>
              Appearance
            </h2>
            <div className={styles.row}>
              <span>Theme</span>
              <div
                className={styles.segment}
                role="radiogroup"
                aria-label="Theme"
              >
                {THEMES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={theme === option.value}
                    className={theme === option.value ? styles.segmentOn : ""}
                    onClick={() => setTheme(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section
            className={styles.section}
            id="plan"
            aria-labelledby="plan-heading"
          >
            <h2 id="plan-heading" className={styles.heading}>
              Plan and billing
            </h2>
            {requested && requested.id !== account.plan ? (
              <div className={styles.confirm}>
                <span>
                  Switch to {requested.name}
                  {requested.id === "free" ? "" : `, billed ${requestedPeriod}`}
                  ?
                </span>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => choosePlan(requested.id, requestedPeriod)}
                >
                  Switch plan
                </button>
              </div>
            ) : null}
            <div className={styles.row}>
              <span>Current plan</span>
              <span className={styles.value}>
                {plan?.name}
                {account.trialEndsAt
                  ? `, trial until ${new Date(account.trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
                  : ""}
              </span>
            </div>
            <div className={styles.buttons}>
              <Link href="/pricing" className={styles.button}>
                Change plan
              </Link>
              {account.plan !== "free" ? (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => choosePlan("free", account.period)}
                >
                  Cancel plan
                </button>
              ) : null}
            </div>
            <p className={styles.note}>
              Cancelling takes effect right away. Yearly plans are refunded for
              the unused months.
            </p>
          </section>

          <section className={styles.section} aria-labelledby="voice">
            <h2 id="voice" className={styles.heading}>
              Voice profile
            </h2>
            <p className={styles.note}>
              {profile
                ? `Built from ${profile.count} ${profile.count === 1 ? "sample" : "samples"} of your writing, ${profile.uploads} uploaded. Margin keeps the measurements, never the text.`
                : "No writing yet. Add a few things you've written, or write a draft over 150 words."}
            </p>
            <div className={styles.buttons}>
              <Link href="/welcome" className={styles.button}>
                Add writing
              </Link>
              {profile && profile.uploads > 0 ? (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => {
                    resetUploads(account.email);
                    rerender();
                    setMessage("Uploaded writing removed from your profile.");
                  }}
                >
                  Remove uploads
                </button>
              ) : null}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="kept">
            <h2 id="kept" className={styles.heading}>
              Kept suggestions
            </h2>
            {kept.length === 0 ? (
              <p className={styles.note}>
                When you stet a note, Margin remembers it here.
              </p>
            ) : (
              <ul className={styles.list}>
                {kept.map((rule) => (
                  <li key={rule.id} className={styles.row}>
                    <span>
                      &ldquo;{rule.match}&rdquo;{" "}
                      <span className={styles.value}>
                        {rule.scope === "all"
                          ? "in all drafts"
                          : `in ${titleOf(rule.draftId)}`}
                      </span>
                    </span>
                    <button
                      type="button"
                      className={styles.button}
                      onClick={() => {
                        removeStet(account.email, rule.id);
                        setKept(listStet(account.email));
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section} aria-labelledby="leave">
            <h2 id="leave" className={styles.heading}>
              Leave
            </h2>
            <div className={styles.buttons}>
              <button type="button" className={styles.button} onClick={logout}>
                Log out
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.danger}`}
                onClick={() => {
                  if (
                    !window.confirm(
                      "Delete your account and every draft on this device? This can't be undone.",
                    )
                  )
                    return;
                  deleteAccount();
                  router.push("/");
                }}
              >
                Delete account
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
