'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './reviews.module.css';

const TOKEN_KEY = 'biteverse-token';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  reply: string;
  repliedAt: string | null;
  at: string | null;
};
type Summary = {
  total: number;
  average: number | null;
  unreplied: number;
  counts: Record<string, number>;
};
type Filter = 'all' | 'high' | 'low';

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

const FILTERS: [Filter, string][] = [
  ['all', 'All'],
  ['high', '4 stars and up'],
  ['low', '3 stars and below'],
];

function stars(n: number) {
  const k = Math.max(0, Math.min(5, Math.round(n)));
  return '★'.repeat(k) + '☆'.repeat(5 - k);
}

function when(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ReviewsView() {
  const [filter, setFilter] = useState<Filter>('all');
  const [rows, setRows] = useState<Review[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [rowErr, setRowErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (f: Filter) => {
    try {
      const j = await api<{ data: Review[]; summary: Summary }>(`/api/admin/reviews?filter=${f}`);
      setRows(j.data);
      setSummary(j.summary);
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  async function postReply(id: string) {
    const text = (drafts[id] ?? '').trim();
    if (!text) {
      setRowErr((p) => ({ ...p, [id]: 'Write a reply first.' }));
      return;
    }
    setBusy(id);
    setRowErr((p) => ({ ...p, [id]: '' }));
    try {
      await api(`/api/admin/reviews/${id}/reply`, { method: 'POST', body: JSON.stringify({ text }) });
      setDrafts((p) => ({ ...p, [id]: '' }));
      await load(filter);
    } catch (e) {
      setRowErr((p) => ({ ...p, [id]: (e as Error).message }));
    } finally {
      setBusy(null);
    }
  }

  const stats = [
    ['Average rating', summary?.average != null ? summary.average.toFixed(1) : '—', 'Across all reviews'],
    ['Total reviews', String(summary?.total ?? 0), 'Customer feedback'],
    ['Awaiting reply', String(summary?.unreplied ?? 0), 'Reviews with no reply yet'],
    ['Five-star reviews', String(summary?.counts['5'] ?? 0), 'Rated 5 out of 5'],
  ];

  return (
    <div className={styles.view}>
      <div className={styles.pagehead}>
        <h1>Reviews</h1>
        <p className={styles.sub}>Read what customers say and reply to them.</p>
      </div>

      {error && <p className={styles.err} role="alert">{error}</p>}

      <div className={styles.stats}>
        {stats.map(([label, value, hint]) => (
          <div key={label} className={styles.stat}>
            <span className={styles.lbl}>{label}</span>
            <span className={styles.val}>{value}</span>
            <span className={styles.hint}>{hint}</span>
          </div>
        ))}
      </div>

      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2>Customer feedback</h2>
          <div className={styles.chips}>
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${styles.chip} ${filter === key ? styles.chipOn : ''}`}
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {rows === null ? (
          <p className={styles.empty}>Loading...</p>
        ) : rows.length === 0 ? (
          <p className={styles.empty}>{summary?.total ? 'No reviews match this filter.' : 'No reviews yet. They appear here once customers leave feedback.'}</p>
        ) : (
          rows.map((r) => (
            <article key={r.id} className={styles.review}>
              <div className={styles.top}>
                <div>
                  <strong>{r.name}</strong>
                  <div className={styles.muted}>{when(r.at)}</div>
                </div>
                <span className={styles.stars} aria-label={`${r.rating} out of 5`}>{stars(r.rating)}</span>
              </div>

              {r.text && <p className={styles.text}>{r.text}</p>}

              {r.reply ? (
                <div className={styles.replyBox}>
                  <span className={styles.lbl}>Your reply</span>
                  <p>{r.reply}</p>
                </div>
              ) : (
                <div className={styles.replyForm}>
                  <label className={styles.lbl} htmlFor={`rp-${r.id}`}>Reply to {r.name}</label>
                  <textarea
                    id={`rp-${r.id}`}
                    className={styles.textarea}
                    rows={3}
                    maxLength={500}
                    value={drafts[r.id] ?? ''}
                    onChange={(e) => setDrafts((p) => ({ ...p, [r.id]: e.target.value }))}
                  />
                  {rowErr[r.id] && <p className={styles.err} role="alert">{rowErr[r.id]}</p>}
                  <div className={styles.actions}>
                    <button type="button" className={styles.btn} disabled={busy === r.id} onClick={() => postReply(r.id)}>
                      {busy === r.id ? 'Posting...' : 'Post reply'}
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </section>

      <p className={styles.note}>Ratings and text come from customer reviews. Replies are visible to the customer.</p>
    </div>
  );
}