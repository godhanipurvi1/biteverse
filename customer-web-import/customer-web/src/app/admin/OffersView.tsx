'use client';

import { useCallback, useEffect, useState } from 'react';
import s from './coupons.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const TOKEN_KEY = 'biteverse-token';

type Offer = {
  id: string;
  code: string;
  title: string;
  description: string;
  type: 'percent' | 'flat';
  value: number;
  maxDiscount: number | null;
  minSubtotal: number;
  active: boolean;
  usedCount?: number;
  usageLimit?: number | null;
  expiresAt?: string | null;
};
type Form = { code: string; title: string; description: string; type: 'percent' | 'flat'; value: string; maxDiscount: string; minSubtotal: string };
const EMPTY: Form = { code: '', title: '', description: '', type: 'percent', value: '', maxDiscount: '', minSubtotal: '' };

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY) ?? '';
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
  return json as T;
}

const rs = (n: number) => `\u20B9${n.toLocaleString('en-IN')}`;

function statusOf(x: Offer): 'active' | 'paused' | 'expired' {
  if (x.expiresAt && new Date(x.expiresAt).getTime() < Date.now()) return 'expired';
  return x.active ? 'active' : 'paused';
}
const STATUS_LABEL = { active: 'Active', paused: 'Paused', expired: 'Expired' } as const;
const STATUS_CLASS = { active: s.active, paused: s.paused, expired: s.expired } as const;

function fmtDate(iso?: string | null) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OffersView({ onToast }: { onToast: (m: string) => void }) {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const j = await api<{ data: Offer[] }>('/api/admin/offers');
      setOffers(j.data);
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setOffers([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const startAdd = () => {
    setEditId(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const startEdit = (x: Offer) => {
    setEditId(x.id);
    setForm({
      code: x.code,
      title: x.title,
      description: x.description,
      type: x.type,
      value: String(x.value),
      maxDiscount: x.maxDiscount == null ? '' : String(x.maxDiscount),
      minSubtotal: x.minSubtotal ? String(x.minSubtotal) : '',
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = JSON.stringify(form);
      if (editId) await api(`/api/admin/offers/${editId}`, { method: 'PATCH', body });
      else await api('/api/admin/offers', { method: 'POST', body });
      onToast(editId ? 'Coupon updated' : 'Coupon created');
      setOpen(false);
      await load();
    } catch (err) {
      onToast((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (x: Offer) => {
    try {
      await api(`/api/admin/offers/${x.id}`, { method: 'PATCH', body: JSON.stringify({ active: !x.active }) });
      onToast(x.active ? `${x.code} paused` : `${x.code} is live`);
      await load();
    } catch (err) {
      onToast((err as Error).message);
    }
  };

  const remove = async (x: Offer) => {
    if (!window.confirm(`Delete ${x.code}? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/offers/${x.id}`, { method: 'DELETE' });
      onToast(`${x.code} deleted`);
      await load();
    } catch (err) {
      onToast((err as Error).message);
    }
  };

  return (
    <div className={s.wrap}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>Offers and coupons</h1>
          <p className={s.sub}>Create discount codes and control when they run.</p>
        </div>
        <button type="button" className={s.createBtn} onClick={startAdd}>
          <span aria-hidden="true">+</span> Create coupon
        </button>
      </div>

      {error && <div className={s.error}>{error}</div>}

      {open && (
        <form onSubmit={save} className={s.card}>
          <div className={s.formGrid}>
            <label className={s.field}>
              Code
              <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="WELCOME20" required />
            </label>
            <label className={s.field}>
              Title
              <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="20% off your first order" required />
            </label>
            <label className={s.field}>
              Discount type
              <select value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat amount (rupees)</option>
              </select>
            </label>
            <label className={s.field}>
              {form.type === 'percent' ? 'Percent off' : 'Rupees off'}
              <input type="number" min="1" step="any" value={form.value} onChange={(e) => set('value', e.target.value)} required />
            </label>
            {form.type === 'percent' && (
              <label className={s.field}>
                Max discount in rupees (optional)
                <input type="number" min="0" step="any" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} />
              </label>
            )}
            <label className={s.field}>
              Minimum order in rupees (optional)
              <input type="number" min="0" step="any" value={form.minSubtotal} onChange={(e) => set('minSubtotal', e.target.value)} />
            </label>
            <label className={`${s.field} ${s.wide}`}>
              Description (optional)
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
            </label>
            <div className={s.formActions}>
              <button type="submit" className={s.createBtn} disabled={busy}>
                {busy ? 'Saving...' : editId ? 'Save changes' : 'Create coupon'}
              </button>
              <button type="button" className={s.btn} onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      <section className={s.card}>
        {offers === null ? (
          <p className={s.empty}>Loading...</p>
        ) : offers.length === 0 ? (
          <p className={s.empty}>No coupons yet. Click Create coupon to add the first one.</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Rules</th>
                <th>Used</th>
                <th>Expires</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {offers.map((x) => {
                const st = statusOf(x);
                const used = x.usedCount ?? 0;
                const limit = x.usageLimit ?? null;
                const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
                return (
                  <tr key={x.id}>
                    <td>
                      <span className={s.code}>{x.code}</span>
                      {x.description && <span className={s.hint}>{x.description}</span>}
                    </td>
                    <td>
                      <span className={s.strong}>{x.type === 'percent' ? `${x.value}% off` : `${rs(x.value)} off`}</span>
                      {x.type === 'percent' && x.maxDiscount != null && <span className={s.meta}>Up to {rs(x.maxDiscount)}</span>}
                    </td>
                    <td>
                      <span className={s.meta}>Min order {x.minSubtotal ? rs(x.minSubtotal) : rs(0)}</span>
                    </td>
                    <td>
                      <span className={s.strong}>{x.usedCount == null ? '\u2014' : limit ? `${used} / ${limit}` : `${used}`}</span>
                      {limit ? (
                        <div className={s.bar}>
                          <div className={s.barFill} style={{ width: `${pct}%` }} />
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className={s.meta}>{fmtDate(x.expiresAt)}</span>
                    </td>
                    <td>
                      <span className={`${s.pill} ${STATUS_CLASS[st]}`}>{STATUS_LABEL[st]}</span>
                    </td>
                    <td>
                      <div className={s.actions}>
                        {st !== 'expired' && (
                          <button type="button" className={s.btn} onClick={() => toggle(x)}>
                            {x.active ? 'Pause' : 'Activate'}
                          </button>
                        )}
                        <button type="button" className={s.btn} onClick={() => startEdit(x)}>Edit</button>
                        <button type="button" className={`${s.btn} ${s.danger}`} onClick={() => remove(x)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}