"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadGoogleButton, saveSession, type AuthUser, validateEmail, passwordChecks, passwordProblem, phoneProblem, getTheme, applyTheme } from "../../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type Errors = { name?: string; email?: string; phone?: string; password?: string; confirm?: string };

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadGoogleButton("g-signin", async (credential) => {
      setMessage("");
      setBusy(true);
      try {
        const res = await fetch(`${API_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });
        const data = (await res.json()) as { token?: string; user?: AuthUser; message?: string };
        if (!res.ok || !data.token || !data.user) { setMessage(data.message ?? "Google sign-in failed."); return; }
        saveSession(data.token, data.user);
        window.location.href = "/";
      } catch {
        setMessage("Could not reach the server.");
      } finally {
        setBusy(false);
      }
    });
  }, []);

  useEffect(() => {
    setTheme(getTheme());
  }, []);

  const checks = passwordChecks(password);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  function validate(): Errors {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Enter your full name (at least 2 characters)";
    if (!validateEmail(email)) e.email = "Enter a valid email, like name@example.com";
    const ph = phoneProblem(phone);
    if (ph) e.phone = ph;
    const pw = passwordProblem(password);
    if (pw) e.password = pw;
    if (confirm !== password) e.confirm = "Passwords do not match";
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setMessage("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password }),
      });
      const data = (await res.json()) as { token?: string; user?: AuthUser; message?: string };
      if (!res.ok || !data.token || !data.user) {
        setMessage(data.message ?? "Could not create your account.");
        return;
      }
      saveSession(data.token, data.user);
      window.location.href = "/";
    } catch {
      setMessage("Could not reach the server. Check that the backend is running on port 5000.");
    } finally {
      setBusy(false);
    }
  }

  const rule = (ok: boolean, text: string) => (
    <li className={ok ? "ok" : ""}>{ok ? "\u2713" : "\u2022"} {text}</li>
  );

  return (
    <main className="auth-shell">
      <section className="auth-form-side">
        <div className="auth-top">
          <Link href="/" className="auth-logo">Bite<b>Verse</b></Link>
          <button type="button" className="auth-theme" onClick={toggleTheme}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Join BiteVerse and start ordering from your favourite restaurants.</p>

        <form onSubmit={submit} noValidate className="auth-form">
          <label className="auth-field">
            Full name
            <div className={`auth-input ${errors.name ? "invalid" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" autoComplete="name" />
            </div>
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>

          <label className="auth-field">
            Email address
            <div className={`auth-input ${errors.email ? "invalid" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" autoComplete="email" />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>

          <label className="auth-field">
            Phone number (optional)
            <div className={`auth-input ${errors.phone ? "invalid" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" inputMode="tel" autoComplete="tel" />
            </div>
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </label>

          <label className="auth-field">
            Password
            <div className={`auth-input ${errors.password ? "invalid" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" autoComplete="new-password" />
              <button type="button" className="auth-eye" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>

          <ul className="auth-rules">
            {rule(checks.length, "At least 8 characters")}
            {rule(checks.upper, "One uppercase letter")}
            {rule(checks.number, "One number")}
            {rule(checks.special, "One special character")}
          </ul>

          <label className="auth-field">
            Confirm password
            <div className={`auth-input ${errors.confirm ? "invalid" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password" />
            </div>
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </label>

          {message && <p role="status" className="auth-error">{message}</p>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="auth-or"><span>OR</span></div>
        <div id="g-signin" className="auth-google-wrap" />

        <p className="auth-foot">Already have an account? <Link href="/login" className="auth-link">Log in</Link></p>
        <p className="auth-terms">By creating an account, you agree to our terms of service and privacy policy.</p>
      </section>

      <aside className="auth-promo">
        <h2>Join the<br /><span>BiteVerse community</span></h2>
        <p>Get access to offers, order tracking, and your own order history in one place.</p>
      </aside>
    </main>
  );
}
