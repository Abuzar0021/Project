"use client";

/**
 * Sign up form: name and work email, with plain-language errors. A plan picked
 * on the pricing page comes along in the address.
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { emailError, findAccount, signUp } from "@/lib/account";
import { planById, type Period } from "@/lib/plans";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Divider } from "@/components/ui/Divider";
import { LogoMark } from "@/components/ui/Logo";
import { GoogleButton } from "./GoogleButton";
import styles from "./Auth.module.css";

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    exists?: boolean;
  }>({});

  const plan = planById(params.get("plan"))?.id;
  const period: Period =
    params.get("period") === "monthly" ? "monthly" : "yearly";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = {
      name: name.trim() ? undefined : "Enter your name.",
      email: emailError(email) ?? undefined,
      exists: false,
    };
    if (!next.email && findAccount(email)) next.exists = true;
    setErrors(next);
    if (next.name || next.email || next.exists) return;

    signUp({ name, email, plan, period });
    router.push("/welcome");
  };

  return (
    <form className={styles.box} onSubmit={submit} noValidate>
      <Link href="/" className={styles.logo} aria-label="Margin home">
        <LogoMark size={32} />
      </Link>
      <h1 className={styles.title}>Create your Margin account</h1>
      <GoogleButton />
      <Divider />
      <Field
        id="signup-name"
        label="Name"
        autoComplete="name"
        placeholder="Mira Tan"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
      />
      <Field
        id="signup-email"
        label="Work email"
        type="email"
        autoComplete="email"
        placeholder="mira@northwind.co"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />
      {errors.exists ? (
        <p className={styles.inlineError} role="alert">
          There&rsquo;s already an account for this email.{" "}
          <Link href="/login">Log in instead</Link>.
        </p>
      ) : null}
      <Button type="submit" variant="primary" block className={styles.submit}>
        Continue with email
      </Button>
      <p className={styles.small}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
      <p className={styles.small}>
        By signing up you agree to the <Link href="/terms">Terms</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </form>
  );
}
