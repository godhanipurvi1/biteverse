"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadGoogleButton, saveSession, type AuthUser, validateEmail, getTheme, applyTheme, getRemember, setRemember } from "../../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRememberState] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
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
    setRememberState(getRemember());
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setMessage("");
    const e: { email?: string; password?: string } = {};
    if (!validateEmail(email)) e.email = "Enter a valid email, like name@example.com";
    if (!password) e.password = "Enter your password";
    setErrors(e);
    if (e.email || e.password) return;

    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = (await res.json()) as { token?: string; user?: AuthUser; message?: string };
      if (!res.ok || !data.token || !data.user) {
        setMessage(data.message ?? "Could not log you in.");
        return;
      }
      setRemember(remember);
      saveSession(data.token, data.user);
      window.location.href = "/";
    } catch {
      setMessage("Could not reach the server. Check that the backend is running on port 5000.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-form-side">
        <div className="auth-top">
          <Link href="/" className="auth-logo">Bite<b>Verse</b></Link>
          <button type="button" className="auth-theme" onClick={toggleTheme}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Log in to your BiteVerse account to order and track your food.</p>

        <form onSubmit={submit} noValidate className="auth-form">
          <label className="auth-field">
            Email address
            <div className={`auth-input ${errors.email ? "invalid" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>

          <label className="auth-field">
            Password
            <div className={`auth-input ${errors.password ? "invalid" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
              <button type="button" className="auth-eye" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>

          <div className="auth-row-between">
            <label className="auth-check">
              <input type="checkbox" checked={remember} onChange={(e) => setRememberState(e.target.checked)} />
              Remember me
            </label>
            <button type="button" className="auth-link" onClick={() => setNote("Password reset is not available yet. Please sign up with a new account for now.")}>
              Forgot password?
            </button>
          </div>
          {note && <p className="auth-note">{note}</p>}
          {message && <p role="status" className="auth-error">{message}</p>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="auth-or"><span>OR</span></div>
        <div id="g-signin" className="auth-google-wrap" />

        <p className="auth-foot">Don&apos;t have an account? <Link href="/signup" className="auth-link">Sign up</Link></p>
      </section>

      <aside className="auth-promo">
        <h2>Good food,<br /><span>delivered to you</span></h2>
        <p>Order from restaurants across Surat, track your delivery live, and pay the way you like.</p>
      </aside>
    </main>
  );
}
