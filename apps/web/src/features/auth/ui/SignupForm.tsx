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
    <section className={styles.page}>
      <h1>Create account</h1>
      <form className={styles.card} onSubmit={onSubmit}>
        <label className={styles.field}>
          Full name
          <input className={styles.input} name="name" minLength={2} maxLength={60} required autoComplete="name" />
        </label>
        <label className={styles.field}>
          Email
          <input className={styles.input} name="email" type="email" required autoComplete="email" />
        </label>
        <label className={styles.field}>
          Mobile number (10 digits, starts with 6 to 9)
          <input
            className={styles.input}
            name="phone"
            inputMode="numeric"
            pattern="[6-9][0-9]{9}"
            required
            autoComplete="tel-national"
          />
        </label>
        <label className={styles.field}>
          Password (8+ characters, include a number)
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
          {busy ? "Creating..." : "Sign up"}
        </button>
      </form>
      <p className={styles.muted}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </section>
  );
}
