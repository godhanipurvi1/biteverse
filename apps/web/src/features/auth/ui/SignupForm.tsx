"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signup } from "../auth.api";
import styles from "../auth.module.css";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const data = await signup({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      formEl.reset();
      setNotice(`${data.message} In development, the verification link is printed in the API window.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.page} style={{ maxWidth: 420, margin: "3rem auto" }}>
      <div className={styles.card} style={{ padding: "2rem" }}>
        <h1 style={{ marginBottom: "0.25rem" }}>Create account</h1>
        <p className={styles.muted} style={{ marginBottom: "1.5rem" }}>
          Order from your favourite restaurants in minutes.
        </p>

        <form onSubmit={onSubmit}>
          <label className={styles.field}>
            Full name
            <input className={styles.input} name="name" minLength={2} maxLength={60} required autoComplete="name" />
          </label>

          <label className={styles.field} style={{ marginTop: "1rem" }}>
            Email
            <input className={styles.input} name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          </label>

          <label className={styles.field} style={{ marginTop: "1rem" }}>
            Mobile number
            <input
              className={styles.input}
              name="phone"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              title="10 digits, starting with 6 to 9"
              placeholder="9876543210"
              required
              autoComplete="tel-national"
            />
            <small className={styles.muted}>10 digits, starting with 6 to 9</small>
          </label>

          <label className={styles.field} style={{ marginTop: "1rem" }}>
            Password
            <input className={styles.input} name="password" type="password" minLength={8} required autoComplete="new-password" />
            <small className={styles.muted}>At least 8 characters, including a number</small>
          </label>

          <div style={{ marginTop: "1.25rem" }}>
            {error && <p className={styles.error}>{error}</p>}
            {notice && <p className={styles.success}>{notice}</p>}
          </div>

          <button className={styles.button} type="submit" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Creating account..." : "Sign up"}
          </button>
        </form>
      </div>

      <p className={styles.muted} style={{ textAlign: "center", marginTop: "1.25rem" }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </section>
  );
}