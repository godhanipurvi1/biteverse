"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { resetPassword } from "../auth.api";
import styles from "../auth.module.css";

export function ResetPasswordForm({ token }: { token: string }) {
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setBusy(true);
    setError(null);
    try {
      const data = await resetPassword({ token, password });
      setNotice(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the password");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <section className={styles.page}>
        <h1>Reset password</h1>
        <p className={styles.error}>This reset link is missing its token.</p>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <h1>Reset password</h1>
      <form className={styles.card} onSubmit={onSubmit}>
        <label className={styles.field}>
          New password (8+ characters, include a number)
          <input
            className={styles.input}
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.success}>{notice}</p>}
        <button className={styles.button} type="submit" disabled={busy}>
          {busy ? "Saving..." : "Set new password"}
        </button>
      </form>
      {notice && (
        <p className={styles.muted}>
          <Link href="/login">Log in with your new password</Link>
        </p>
      )}
    </section>
  );
}
