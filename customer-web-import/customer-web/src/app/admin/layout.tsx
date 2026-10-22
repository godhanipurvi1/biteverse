'use client';

import { useCallback, useEffect, useState } from 'react';
import s from './gate.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const TOKEN_KEY = 'biteverse-token';

type State = 'checking' | 'in' | 'out' | 'denied' | 'down';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>('checking');
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const check = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState('out');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setState('in');
      else if (res.status === 403) setState('denied');
      else {
        localStorage.removeItem(TOKEN_KEY);
        setState('out');
      }
    } catch {
      setState('down');
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setPassword('');
    setError('');
    setState('out');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Login failed');
      localStorage.setItem(TOKEN_KEY, json.token);
      setPassword('');
      await check();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (state === 'in') {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <div className={s.logo}>Bite<b>Verse</b> Admin</div>
        {state === 'checking' && <p className={s.note}>Checking your session...</p>}
        {state === 'down' && (
          <>
            <p className={s.err}>Cannot reach the server. Is the backend running on port 5000?</p>
            <button type="button" className={s.btn} onClick={check}>Try again</button>
          </>
        )}
        {state === 'denied' && (
          <>
            <p className={s.err}>Admins only. This account does not have admin access.</p>
            <button type="button" className={s.btn} onClick={logout}>Use a different account</button>
          </>
        )}
        {state === 'out' && (
          <form onSubmit={submit} className={s.form}>
            <label className={s.label}>
              Username or email
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </label>
            <label className={s.label}>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </label>
            {error && <p className={s.err}>{error}</p>}
            <button type="submit" className={s.btn} disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
          </form>
        )}
      </div>
    </div>
  );
}



