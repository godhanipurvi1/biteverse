"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { resendVerification, verifyEmail } from "../auth.api";
import styles from "../auth.module.css";

const COOLDOWN_SECONDS = 60;

export function VerifyEmail({ token }: { token: string }) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  // Strict Mode runs effects twice in development. The token works only once,
  // so the request must run exactly once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setResult({ ok: false, message: "This verification link is missing its token." });
      return;
    }
    verifyEmail(token)
      .then((data) => setResult({ ok: true, message: data.message }))
      .catch((err: unknown) =>
        setResult({ ok: false, message: err instanceof Error ? err.message : "Verification failed" }),
      );
  }, [token]);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  async function onResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setBusy(true);
    setResendError(null);
    try {
      const data = await resendVerification(email);
      setNotice(`${data.message} In development, the link is printed in the API window.`);
      setWait(COOLDOWN_SECONDS);
    } catch (err) {
      setResendError(err instanceof Error ? err.message : "Could not resend the email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.page}>
      <h1>Verify email</h1>
      {!result && <p className={styles.muted}>Verifying...</p>}
      {result && <p className={result.ok ? styles.success : styles.error}>{result.message}</p>}
      {result?.ok && (
        <p>
          <Link href="/login">Log in</Link>
        </p>
      )}
      {result && !result.ok && (
        <form className={styles.card} onSubmit={onResend}>
          <p className={styles.muted}>Didn&apos;t get the email? Enter your address to resend it.</p>
          <label className={styles.field}>
            Email
            <input className={styles.input} name="email" type="email" required autoComplete="email" />
          </label>
          {resendError && <p className={styles.error}>{resendError}</p>}
          {notice && <p className={styles.success}>{notice}</p>}
          <button className={styles.button} type="submit" disabled={busy || wait > 0}>
            {busy ? "Sending..." : wait > 0 ? `Resend in ${wait}s` : "Resend verification email"}
          </button>
        </form>
      )}
    </section>
  );
}
