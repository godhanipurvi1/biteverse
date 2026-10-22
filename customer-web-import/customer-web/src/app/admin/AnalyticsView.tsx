'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './analytics.module.css';

const TOKEN_KEY = 'biteverse-token';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

type Item = { name: string; qty: number };
type Status = { key: string; label: string; color: string; count: number };
type Pay = { label: string; count: number };
type Data = {
  avgOrderValue: number | null;
  cancelledCount: number;
  orderCount: number;
  cancellationPct: number | null;
  itemsSold: number;
  vegPct: number | null;
  topItems: Item[];
  statuses: Status[];
  payments: Pay[];
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

const rs = (n: number) => `\u20B9${Math.round(n).toLocaleString('en-IN')}`;

export default function AnalyticsView() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api<Data>('/api/admin/analytics/summary'));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const topMax = Math.max(1, ...(data?.topItems.map((i) => i.qty) ?? [1]));
  const statusTotal = (data?.statuses ?? []).reduce((s, x) => s + x.count, 0);
  const payTotal = (data?.payments ?? []).reduce((s, x) => s + x.count, 0);

  const stats = [
    {
      label: 'Avg order value',
      value: data?.avgOrderValue != null ? rs(data.avgOrderValue) : '—',
      hint: 'Excluding cancelled orders',
      cls: styles.ok,
    },
    {
      label: 'Cancellation rate',
      value: data?.cancellationPct != null ? `${data.cancellationPct}%` : '—',
      hint: data ? `${data.cancelledCount} of ${data.orderCount} orders` : '',
      cls: styles.neg,
    },
    {
      label: 'Items sold',
      value: (data?.itemsSold ?? 0).toLocaleString('en-IN'),
      hint: 'Excluding cancelled orders',
      cls: styles.ok,
    },
    {
      label: 'Vegetarian share',
      value: data?.vegPct != null ? `${data.vegPct}%` : '—',
      hint: 'Of items with a veg flag on the menu',
      cls: styles.ok,
    },
  ];

  return (
    <div className={styles.view}>
      <div className={styles.pagehead}>
        <h1>Analytics</h1>
        <p className={styles.sub}>How orders, menu items and payments are performing.</p>
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
        <>
          <div className={styles.grid}>
            <section className={styles.card}>
              <header className={styles.cardHead}>
                <h2>Top selling items</h2>
              </header>
              {data.topItems.length === 0 ? (
                <p className={styles.empty}>No sales yet.</p>
              ) : (
                <ol className={styles.rankList}>
                  {data.topItems.map((i) => (
                    <li key={i.name} className={styles.rankRow}>
                      <div className={styles.rankTop}>
                        <span>{i.name}</span>
                        <span className={styles.num}>{i.qty}</span>
                      </div>
                      <div className={styles.track}>
                        <i style={{ width: `${(i.qty / topMax) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className={styles.card}>
              <header className={styles.cardHead}>
                <h2>Order status</h2>
                <span className={styles.muted}>{statusTotal} orders</span>
              </header>
              {statusTotal === 0 ? (
                <p className={styles.empty}>No orders yet.</p>
              ) : (
                <>
                  <div className={styles.statusBar} role="img" aria-label="Order status split">
                    {data.statuses
                      .filter((s) => s.count > 0)
                      .map((s) => (
                        <i key={s.key} title={`${s.label}: ${s.count}`} style={{ width: `${(s.count / statusTotal) * 100}%`, background: s.color }} />
                      ))}
                  </div>
                  <ul className={styles.legend}>
                    {data.statuses.map((s) => (
                      <li key={s.key}>
                        <span className={styles.swatch} style={{ background: s.color }} />
                        <span>{s.label}</span>
                        <span className={styles.num}>{s.count}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>

          <section className={`${styles.card} ${styles.wide}`}>
            <header className={styles.cardHead}>
              <h2>Payment methods</h2>
            </header>
            {data.payments.length === 0 ? (
              <p className={styles.empty}>No payments yet.</p>
            ) : (
              <ol className={styles.rankList}>
                {data.payments.map((p) => (
                  <li key={p.label} className={styles.rankRow}>
                    <div className={styles.rankTop}>
                      <span>{p.label}</span>
                      <span className={styles.num}>
                        {p.count} orders ({Math.round((p.count / payTotal) * 100)}%)
                      </span>
                    </div>
                    <div className={styles.track}>
                      <i style={{ width: `${(p.count / payTotal) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
      <p className={styles.note}>Figures come from your live orders. Cancelled orders are left out of sales totals.</p>
    </div>
  );
}