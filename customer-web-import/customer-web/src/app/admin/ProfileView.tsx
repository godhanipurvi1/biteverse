'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import styles from './profile.module.css';

const TOKEN_KEY = 'biteverse-token';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

type Prefs = { newOrder: boolean; cancellation: boolean; paymentFailure: boolean; unavailableItem: boolean };
type Profile = { name: string; email: string; phone: string; role: string; prefs: Prefs };

const PREF_ROWS: [keyof Prefs, string][] = [
  ['newOrder', 'New order alerts'],
  ['cancellation', 'Cancellation alerts'],
  ['paymentFailure', 'Payment failures'],
  ['unavailableItem', 'Unavailable item warnings'],
];

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY) ?? '';
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
  return json as T;
}

export default function ProfileView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [prefBusy, setPrefBusy] = useState<keyof Prefs | null>(null);

  const load = useCallback(async () => {
    try {
      const j = await api<{ data: Profile }>('/api/admin/profile');
      setProfile(j.data);
      setForm({ name: j.data.name, email: j.data.email, phone: j.data.phone });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const j = await api<{ data: Profile }>('/api/admin/profile', { method: 'PATCH', body: JSON.stringify(form) });
      setProfile(j.data);
      setForm({ name: j.data.name, email: j.data.email, phone: j.data.phone });
      setMsg({ ok: true, text: 'Profile saved.' });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function togglePref(key: keyof Prefs) {
    if (!profile) return;
    const next = { ...profile.prefs, [key]: !profile.prefs[key] };
    setPrefBusy(key);
    setMsg(null);
    try {
      const j = await api<{ data: Profile }>('/api/admin/profile', { method: 'PATCH', body: JSON.stringify({ prefs: next }) });
      setProfile(j.data);
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setPrefBusy(null);
    }
  }

  if (profile === null) {
    return (
      <div className={styles.view}>
        <div className={styles.pagehead}>
          <h1>My profile</h1>
        </div>
        {msg ? <p className={styles.err} role="alert">{msg.text}</p> : <p className={styles.empty}>Loading...</p>}
      </div>
    );
  }

  const initial = (profile.name || 'A').charAt(0).toUpperCase();

  return (
    <div className={styles.view}>
      <div className={styles.pagehead}>
        <h1>My profile</h1>
        <p className={styles.sub}>Your admin account and notification preferences.</p>
      </div>

      {msg && <p className={msg.ok ? styles.okMsg : styles.err} role="status">{msg.text}</p>}

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Account</h2>
          <div className={styles.avatarRow}>
            <span className={styles.avatar}>{initial}</span>
            <div className={styles.who}>
              <b>{profile.name}</b>
              <span className={styles.muted}>{profile.role === 'admin' ? 'Administrator' : profile.role}</span>
            </div>
          </div>

          <form onSubmit={saveProfile} className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.lbl} htmlFor="pf-name">Name</label>
              <input id="pf-name" className={styles.input} value={form.name} maxLength={80} required
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label className={styles.lbl} htmlFor="pf-mail">Email</label>
              <input id="pf-mail" className={styles.input} type="email" value={form.email} required
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className={`${styles.field} ${styles.wide}`}>
              <label className={styles.lbl} htmlFor="pf-phone">Phone</label>
              <input id="pf-phone" className={styles.input} value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className={`${styles.actions} ${styles.wide}`}>
              <button type="submit" className={styles.btn} disabled={saving}>
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
          <p className={styles.note}>Changing your email changes the address you sign in with.</p>
        </section>

        <section className={styles.card}>
          <h2>Notifications</h2>
          {PREF_ROWS.map(([key, label]) => (
            <div key={key} className={styles.toggleRow}>
              <span>{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={profile.prefs[key]}
                aria-label={label}
                className={`${styles.switch} ${profile.prefs[key] ? styles.switchOn : ''}`}
                disabled={prefBusy === key}
                onClick={() => togglePref(key)}
              />
            </div>
          ))}
          <p className={styles.note}>Your choices are saved to your account. Alert delivery is not connected yet.</p>
        </section>
      </div>
    </div>
  );
}