'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import styles from './admin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
// Keep in sync with TOKEN_KEY in page.tsx.
const TOKEN_KEY = 'biteverse-token';

type Filter = 'all' | 'captured' | 'pending' | 'refunded';

type Row = {
  id: string;
  order: string;
  customer: string;
  method: string;
  amount: number;
  status: Exclude<Filter, 'all'>;
  createdAt: string;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const METHOD: Record<string, string> = { upi: 'UPI', card: 'Card', cod: 'Cash on delivery' };

// Maps an order to a payment status. Confirm this against your real data later.
function statusOf(orderStatus: string, payment: string): Exclude<Filter, 'all'> {
  if (orderStatus === 'cancelled') return 'refunded';
  if (orderStatus === 'delivered' || (payment !== 'cod' && orderStatus !== 'placed')) return 'captured';
  return 'pending';
}

function toRow(p: Record<string, unknown>): Row {
  const payment = String(p.payment ?? p.method ?? '');
  const orderStatus = String(p.orderStatus ?? p.status ?? '');
  const customer = p.customer;
  const customerName =
    typeof customer === 'string'
      ? customer
      : (customer as { name?: string } | null)?.name ?? '';
  const amount = Number(p.total ?? p.amount ?? 0);
  return {
    id: String(p.id ?? p._id ?? p.order ?? ''),
    order: String(p.order ?? p.trackingCode ?? p.id ?? ''),
    customer: customerName || 'Guest',
    method: METHOD[payment] ?? (payment || '-'),
    amount: amount / (p.total !== undefined ? 1 : 100),
    status: (p.paymentStatus as Exclude<Filter, 'all'>) ?? statusOf(orderStatus, payment),
    createdAt: String(p.createdAt ?? ''),
  };
}

const card: CSSProperties = { padding: 24, display: 'grid', gap: 12 };
const pill: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 999,
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--ink)',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};
const pillOn: CSSProperties = { ...pill, background: 'var(--brand)', color: 'var(--brand-ink)', border: 'none' };

export default function PaymentsView() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY) ?? '';
        const res = await fetch(`${API_URL}/api/admin/payments`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || `Could not load payments (${res.status})`);
        const list: Record<string, unknown>[] = Array.isArray(json) ? json : json.data ?? [];
        setRows(list.map(toRow));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    const sum = (s: Row['status']) => rows.filter((r) => r.status === s);
    const captured = sum('captured');
    const pending = sum('pending');
    const refunded = sum('refunded');
    const amt = (list: Row[]) => list.reduce((n, r) => n + r.amount, 0);
    return {
      captured: { amount: amt(captured), count: captured.length },
      pending: { amount: amt(pending), count: pending.length },
      refunded: { amount: amt(refunded), count: refunded.length },
    };
  }, [rows]);

  const shown = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  const summary = [
    { key: 'captured', label: 'Captured', amount: totals.captured.amount, count: totals.captured.count, tone: 'var(--ok)' },
    { key: 'pending', label: 'Pending', amount: totals.pending.amount, count: totals.pending.count, tone: 'var(--warn)' },
    { key: 'refunded', label: 'Refunded', amount: totals.refunded.amount, count: totals.refunded.count, tone: 'var(--bad)' },
  ];

  return (
    <div className={styles.view}>
      <div className={styles.pagehead}>
        <div>
          <h1 className={styles.title}>Payments</h1>
          <p className={styles.sub}>Payment status for every order, amounts in INR.</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        {summary.map((s) => (
          <div key={s.key} className={styles.card} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--brand-soft)',
                  color: 'var(--brand-text)',
                  fontWeight: 700,
                }}
              >
                ₹
              </span>
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)' }}>{inr(s.amount)}</div>
            <div style={{ fontSize: 13, color: s.tone, fontWeight: 600 }}>
              {s.count} {s.count === 1 ? 'payment' : 'payments'}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.card} style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--ink)' }}>Transactions</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['all', 'captured', 'pending', 'refunded'] as Filter[]).map((f) => (
              <button key={f} type="button" style={filter === f ? pillOn : pill} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {!loaded ? (
          <div className={styles.empty}>Loading payments…</div>
        ) : shown.length === 0 ? (
          <div className={styles.empty}>No payments yet.</div>
        ) : (
          <div className={styles.tw}>
            <table>
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id + r.order}>
                    <td>{r.id.slice(-6).toUpperCase()}</td>
                    <td>{r.order}</td>
                    <td>{r.customer}</td>
                    <td>{r.method}</td>
                    <td className={styles.num}>{inr(r.amount)}</td>
                    <td>
                      <span
                        className={styles.badge}
                        style={{
                          color: r.status === 'captured' ? 'var(--ok)' : r.status === 'pending' ? 'var(--warn)' : 'var(--bad)',
                          background:
                            r.status === 'captured' ? 'var(--ok-soft)' : r.status === 'pending' ? 'var(--warn-soft)' : 'var(--bad-soft)',
                        }}
                      >
                        {r.status[0].toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}