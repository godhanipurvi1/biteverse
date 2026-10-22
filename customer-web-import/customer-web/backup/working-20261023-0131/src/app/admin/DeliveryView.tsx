'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './delivery.module.css';

const TOKEN_KEY = 'biteverse-token';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

type Area = { name: string; count: number };
type Data = {
  avgMinutes: number | null;
  onTimePct: number | null;
  targetMinutes: number;
  outNow: number;
  activeRiders: number | null;
  byHour: number[];
  areas: Area[];
  deliveredCount: number;
};

async function api<T>(path: string): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY) ?? '';
  const res = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
  return json as T;
}

// Chart shows 11am to 10pm, matching the prototype.
const HOURS = Array.from({ length: 12 }, (_, i) => i + 11);

function hourLabel(h: number) {
  if (h === 0) return '12a';
  if (h < 12) return `${h}a`;
  if (h === 12) return '12p';
  return `${h - 12}p`;
}

export default function DeliveryView() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api<Data>('/api/admin/delivery'));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hours = data ? HOURS.map((h) => ({ h, n: data.byHour[h] ?? 0 })) : [];
  const max = Math.max(1, ...hours.map((x) => x.n));
  const peak = hours.reduce((best, x) => (x.n > best.n ? x : best), { h: -1, n: 0 }).h;
  const topArea = data?.areas[0]?.count ?? 1;

  const stats = [
    {
      label: 'Avg delivery time',
      value: data?.avgMinutes != null ? `${data.avgMinutes} min` : '—',
      hint: data ? `${data.deliveredCount} delivered in the last 7 days` : '',
      cls: styles.ok,
    },
    {
      label: 'On-time rate',
      value: data?.onTimePct != null ? `${data.onTimePct}%` : '—',
      hint: `Within ${data?.targetMinutes ?? 45} min target`,
      cls: styles.ok,
    },
    {
      label: 'Active riders',
      value: '—',
      hint: 'Rider tracking is not set up yet',
      cls: styles.neg,
    },
    {
      label: 'Out for delivery',
      value: String(data?.outNow ?? 0),
      hint: 'Live right now',
      cls: styles.ok,
    },
  ];

  return (
    <div className={styles.view}>
      <div className={styles.pagehead}>
        <h1>Delivery analytics</h1>
        <p className={styles.sub}>How quickly orders reach customers and where they go.</p>
      </div>

      {error && <p className={styles.err} role="alert">{error}</p>}

      <div className={styles.stats}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.lbl}>{s.label}</span>
            <span className={styles.val}>{s.value}</span>
            <span className={`${styles.hint} ${s.cls}`}>{s.hint}</span>
          </div>
        ))}
      </div>

      {data === null ? (
        <p className={styles.empty}>Loading...</p>
      ) : (
        <div className={styles.grid}>
          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2>Orders by hour</h2>
              <span className={styles.muted}>Today</span>
            </header>
            <div className={styles.bars}>
              {hours.map(({ h, n }) => (
                <div key={h} className={styles.col}>
                  <div className={styles.barWrap}>
                    <div
                      className={`${styles.bar} ${h === peak && n > 0 ? styles.barOn : ''}`}
                      style={{ height: `${(n / max) * 100}%` }}
                      title={`${n} orders`}
                    />
                  </div>
                  <span className={styles.axis}>{hourLabel(h)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2>Top delivery areas</h2>
              <span className={styles.muted}>Last 7 days</span>
            </header>
            {data.areas.length === 0 ? (
              <p className={styles.empty}>No deliveries yet.</p>
            ) : (
              <ul className={styles.areaList}>
                {data.areas.map((a) => (
                  <li key={a.name} className={styles.areaRow}>
                    <div className={styles.areaTop}>
                      <span>{a.name}</span>
                      <span className={styles.num}>{a.count}</span>
                    </div>
                    <div className={styles.track}>
                      <i style={{ width: `${(a.count / topArea) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
      <p className={styles.note}>Delivery time runs from placed to delivered. On-time means within the target above.</p>
    </div>
  );
}