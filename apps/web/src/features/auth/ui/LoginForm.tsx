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
    <section className={styles.page} style={{ maxWidth: 420, margin: "3rem auto" }}>
      <div className={styles.card} style={{ padding: "2rem" }}>
        <h1 style={{ marginBottom: "0.25rem" }}>Welcome back</h1>
        <p className={styles.muted} style={{ marginBottom: "1.5rem" }}>
          Log in to order, track, and manage your account.
        </p>

        <form onSubmit={onSubmit}>
          <label className={styles.field}>
            Email
            <input
              className={styles.input}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className={styles.field} style={{ marginTop: "1rem" }}>
            Password
            <input
              className={styles.input}
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          <p style={{ textAlign: "right", margin: "0.5rem 0 1rem", fontSize: "0.9rem" }}>
            <Link href="/forgot-password">Forgot password?</Link>
          </p>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.button} type="submit" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>

      <p className={styles.muted} style={{ textAlign: "center", marginTop: "1.25rem" }}>
        New to BiteVerse? <Link href="/signup">Create an account</Link>
      </p>
    </section>
  );
}