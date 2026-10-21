"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { forgotPassword } from "../auth.api";
import styles from "../auth.module.css";

export function ForgotPasswordForm() {
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setBusy(true);
    setError(null);
    try {
      const data = await forgotPassword(email);
      setNotice(`${data.message} In development, the reset link is printed in the API window.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.page}>
      <h1>Forgot password</h1>
      <form className={styles.card} onSubmit={onSubmit}>
        <label className={styles.field}>
          Email
          <input className={styles.input} name="email" type="email" required autoComplete="email" />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.success}>{notice}</p>}
        <button className={styles.button} type="submit" disabled={busy}>
          {busy ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p className={styles.muted}>
        <Link href="/login">Back to log in</Link>
      </p>
    </section>
  );
}
