"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { login } from "../auth.api";
import styles from "../auth.module.css";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const { user } = await login({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      window.location.assign(user.role === "admin" ? "/admin" : "/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in");
      setBusy(false);
    }
  }

  return (
    <section className={styles.page}>
      <h1>Log in</h1>
      <form className={styles.card} onSubmit={onSubmit}>
        <label className={styles.field}>
          Email
          <input className={styles.input} name="email" type="email" autoComplete="email" required />
        </label>
        <label className={styles.field}>
          Password
          <input
            className={styles.input}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.button} type="submit" disabled={busy}>
          {busy ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className={styles.muted}>
        New here? <Link href="/signup">Create an account</Link> ·{" "}
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
    </section>
  );
}
