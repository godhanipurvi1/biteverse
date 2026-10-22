
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './customers.module.css';

const TOKEN_KEY = 'biteverse-token';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

type Customer = {
  id: string;
  name: string;
  phone: string;
  area: string;
  orders: number;
  spent: number;
  last: string | null;
  isAccount: boolean;
};

type Summary = {
  customers: number;
  repeat: number;
  repeatPct: number;
  avgOrderValue: number;
  revenue: number;
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

function when(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CustomersView() {
  const [rows, setRows] = useState<Customer[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    try {
      const j = await api<{ data: Customer[]; summary: Summary }>('/api/admin/customers');
      setRows(j.data);
      setSummary(j.summary);
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s || !rows) return rows ?? [];
    const digits = s.replace(/\D/g, '');
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.area.toLowerCase().includes(s) ||
        (digits && c.phone.replace(/\D/g, '').includes(digits)),
    );
  }, [rows, q]);

  const stats = [
    ['Customers', String(summary?.customers ?? 0), 'Ordered at least once'],
    ['Repeat customers', `${summary?.repeatPct ?? 0}%`, `${summary?.repeat ?? 0} ordered more than once`],
    ['Avg order value', rs(summary?.avgOrderValue ?? 0), 'Excluding cancelled orders'],
    ['Customer revenue', rs(summary?.revenue ?? 0), 'All time, excluding cancelled'],
  ];

  return (
    <div className={styles.view}>
      <div className={styles.pagehead}>
        <h1>Customers</h1>
        <p className={styles.sub}>Who orders from BiteVerse and how often they come back.</p>
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
          <h2>All customers</h2>
          <input
            className={styles.search}
            type="search"
            placeholder="Search by name, area or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search customers"
          />
        </header>

        {rows === null ? (
          <p className={styles.empty}>Loading...</p>
        ) : shown.length === 0 ? (
          <p className={styles.empty}>{rows.length === 0 ? 'No customers yet. They appear after their first order.' : 'No customers match your search.'}</p>
        ) : (
          <div className={styles.tw}>
            <table>
              <thead>
                <tr>
                  <th>Customer</th><th>Area</th><th>Phone</th><th className={styles.num}>Orders</th>
                  <th className={styles.num}>Spent</th><th>Last order</th><th>Type</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong>{!c.isAccount && <div className={styles.note}>Guest</div>}</td>
                    <td>{c.area}</td>
                    <td className={styles.mono}>{c.phone}</td>
                    <td className={styles.num}>{c.orders}</td>
                    <td className={styles.num}>{rs(c.spent)}</td>
                    <td className={styles.muted}>{when(c.last)}</td>
                    <td>
                      <span className={c.orders > 1 ? styles.repeat : styles.fresh}>{c.orders > 1 ? 'Repeat' : 'New'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className={styles.note}>Shows order history only. Account passwords are never displayed.</p>
    </div>
  );
}