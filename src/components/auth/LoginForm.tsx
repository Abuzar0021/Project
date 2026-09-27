"use client";

/**
 * Log in form. Finds the account on this device and returns the writer to the
 * page they were sent away from.
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { emailError, logIn } from "@/lib/account";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Divider } from "@/components/ui/Divider";
import { LogoMark } from "@/components/ui/Logo";
import { GoogleButton } from "./GoogleButton";
import styles from "./Auth.module.css";

/** Only send people back to pages inside the product. */
function safeNext(next: string | null): string {
  return next && (next.startsWith("/app") || next === "/welcome")
    ? next
    : "/app";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unknown, setUnknown] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const problem = emailError(email);
    setError(problem);
    setUnknown(false);
    if (problem) return;
    if (!logIn(email)) {
      setUnknown(true);
      return;
    }
    router.push(safeNext(params.get("next")));
  };

  return (
    <form className={styles.box} onSubmit={submit} noValidate>
      <Link href="/" className={styles.logo} aria-label="Margin home">
        <LogoMark size={32} />
      </Link>
      <h1 className={styles.title}>Log in to Margin</h1>
      <GoogleButton />
      <Divider />
      <Field
        id="login-email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="mira@northwind.co"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={error}
      />
      {unknown ? (
        <p className={styles.inlineError} role="alert">
          There&rsquo;s no account for that email on this device yet.{" "}
          <Link href="/signup">Sign up</Link> first.
        </p>
      ) : null}
      <Button type="submit" variant="primary" block className={styles.submit}>
        Log in with email
      </Button>
      <p className={styles.small}>
        No account yet? <Link href="/signup">Sign up</Link>
      </p>
    </form>
  );
}
