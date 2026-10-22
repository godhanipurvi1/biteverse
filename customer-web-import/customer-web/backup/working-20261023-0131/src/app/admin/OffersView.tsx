'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './admin.module.css';
import o from './offers.module.css';

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
      onToast(editId ? 'Offer updated' : 'Offer added');
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
    <div className={styles.view}>
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h2 className={styles.h2}>Offers and coupons</h2>
            <p className={styles.sub}>Live offers are shown to customers on the website.</p>
          </div>
          <button type="button" className={`${styles.btn} ${styles.btnPri}`} onClick={startAdd}>Add offer</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {open && (
          <form onSubmit={save} className={o.formGrid}>
            <label className={o.field}>
              Code
              <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="WELCOME20" required />
            </label>
            <label className={o.field}>
              Title
              <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="20% off your first order" required />
            </label>
            <label className={o.field}>
              Discount type
              <select value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat amount (rupees)</option>
              </select>
            </label>
            <label className={o.field}>
              {form.type === 'percent' ? 'Percent off' : 'Rupees off'}
              <input type="number" min="1" step="any" value={form.value} onChange={(e) => set('value', e.target.value)} required />
            </label>
            {form.type === 'percent' && (
              <label className={o.field}>
                Max discount in rupees (optional)
                <input type="number" min="0" step="any" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} />
              </label>
            )}
            <label className={o.field}>
              Minimum order in rupees (optional)
              <input type="number" min="0" step="any" value={form.minSubtotal} onChange={(e) => set('minSubtotal', e.target.value)} />
            </label>
            <label className={`${o.field} ${o.wide}`}>
              Description (optional)
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
            </label>
            <div className={`${o.actions} ${o.wide}`}>
              <button type="submit" className={`${styles.btn} ${styles.btnPri}`} disabled={busy}>{busy ? 'Saving...' : editId ? 'Save changes' : 'Add offer'}</button>
              <button type="button" className={styles.btn} onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        )}
      </section>

      <section className={styles.card}>
        {offers === null ? (
          <p className={styles.muted}>Loading...</p>
        ) : offers.length === 0 ? (
          <p className={styles.muted}>No offers yet. Click Add offer to create the first one.</p>
        ) : (
          <div className={styles.tw}>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Offer</th>
                  <th>Discount</th>
                  <th>Min order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((x) => (
                  <tr key={x.id}>
                    <td className={styles.mono}>{x.code}</td>
                    <td>{x.title}</td>
                    <td className={styles.num}>
                      {x.type === 'percent' ? `${x.value}% off` : `${rs(x.value)} off`}
                      {x.type === 'percent' && x.maxDiscount != null ? ` (max ${rs(x.maxDiscount)})` : ''}
                    </td>
                    <td className={styles.num}>{x.minSubtotal ? rs(x.minSubtotal) : '-'}</td>
                    <td><span className={`${styles.badge} ${x.active ? styles.b_delivered : styles.b_placed}`}>{x.active ? 'Active' : 'Paused'}</span></td>
                    <td>
                      <div className={o.rowBtns}>
                        <button type="button" className={`${styles.btn} ${o.small}`} onClick={() => toggle(x)}>{x.active ? 'Pause' : 'Resume'}</button>
                        <button type="button" className={`${styles.btn} ${o.small}`} onClick={() => startEdit(x)}>Edit</button>
                        <button type="button" className={`${styles.btn} ${styles.btnDanger} ${o.small}`} onClick={() => remove(x)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
