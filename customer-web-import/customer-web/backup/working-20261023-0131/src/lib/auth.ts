"use client";

const TOKEN_KEY = "biteverse-token";
const USER_KEY = "biteverse-user";

export type AuthUser = { id: string; name: string; email: string; phone: string };

export function getToken(): string | null {
  try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function getUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

export function saveSession(token: string, user: AuthUser) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function passwordChecks(p: string) {
  return {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
}

export function passwordProblem(p: string): string | null {
  const c = passwordChecks(p);
  if (!c.length) return "At least 8 characters";
  if (!c.upper) return "Include an uppercase letter";
  if (!c.number) return "Include a number";
  if (!c.special) return "Include a special character (like ! or #)";
  return null;
}

export function phoneProblem(p: string): string | null {
  if (!p.trim()) return null;
  return p.replace(/\D/g, "").length === 10 ? null : "Enter a 10-digit phone number";
}

export function getTheme(): "light" | "dark" {
  try {
    return window.localStorage.getItem("biteverse-theme") === "light" ? "light" : "dark";
  } catch { return "dark"; }
}

export function applyTheme(t: "light" | "dark") {
  document.documentElement.dataset.theme = t;
  try { window.localStorage.setItem("biteverse-theme", t); } catch {}
}

export function getRemember(): boolean {
  try { return window.localStorage.getItem("biteverse-remember") !== "no"; } catch { return true; }
}

export function setRemember(v: boolean) {
  try { window.localStorage.setItem("biteverse-remember", v ? "yes" : "no"); } catch {}
}

export function loadGoogleButton(elementId: string, onCredential: (credential: string) => void) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const el = document.getElementById(elementId);
  if (!clientId || !el) return;
  const init = () => {
    const g = (window as any).google;
    if (!g?.accounts?.id) return;
    g.accounts.id.initialize({ client_id: clientId, callback: (r: { credential: string }) => onCredential(r.credential) });
    g.accounts.id.renderButton(el, { theme: "filled_black", size: "large", shape: "pill", width: 340, text: "continue_with" });
  };
  if ((window as any).google?.accounts?.id) { init(); return; }
  const existing = document.getElementById("gis-script");
  if (existing) { existing.addEventListener("load", init); return; }
  const s = document.createElement("script");
  s.id = "gis-script";
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.onload = init;
  document.head.appendChild(s);
}
