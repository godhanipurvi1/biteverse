'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react';
import styles from './admin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
// Keep in sync with TOKEN_KEY in page.tsx.
const TOKEN_KEY = 'biteverse-token';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const CATEGORIES = ['Thali', 'Burgers', 'Pizza', 'Biryani', 'Chinese', 'Desserts', 'Healthy'];

type Dish = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  veg: boolean | null;
  available: boolean;
  featured: boolean;
};

const EMPTY_FORM = {
  restaurantId: '',
  name: '',
  category: 'Thali',
  price: '',
  prepTime: '15',
  type: 'veg' as 'veg' | 'nonveg',
  available: true,
};

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

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const fieldLabel: CSSProperties = { display: 'grid', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--ink)' };
const fieldInput: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: 'var(--surface-2)',
  color: 'var(--ink)',
  fontSize: 15,
  font: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};
const orangeBtn: CSSProperties = {
  padding: '12px 24px',
  borderRadius: 999,
  border: 'none',
  background: 'var(--brand)',
  color: 'var(--brand-ink)',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
};
const outlineBtn: CSSProperties = {
  padding: '12px 24px',
  borderRadius: 999,
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--ink)',
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
};
const filterInput: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: 'var(--surface-2)',
  color: 'var(--ink)',
  fontSize: 14,
  font: 'inherit',
  minWidth: 0,
  boxSizing: 'border-box',
};
const pill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px',
  borderRadius: 999,
  background: 'var(--brand-soft)',
  color: 'var(--brand-text)',
  fontSize: 13,
  fontWeight: 600,
};

export default function MenuView({ onToast }: { onToast: (m: string) => void }) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [q, setQ] = useState('');
  const [restaurantId, setRestaurantId] = useState('all');
  const [restaurantQuery, setRestaurantQuery] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    try {
      const j = await api<{ data: Dish[] }>('/api/admin/menu');
      setDishes(j.data);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // One entry per restaurant id, with its dish count.
  const restaurantOptions = useMemo(() => {
    const names = new Map<string, string>();
    const counts = new Map<string, number>();
    for (const d of dishes) {
      names.set(d.restaurantId, d.restaurantName);
      counts.set(d.restaurantId, (counts.get(d.restaurantId) ?? 0) + 1);
    }
    return Array.from(names, ([id, name]) => ({ id, name, count: counts.get(id) ?? 0 })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [dishes]);

  const visibleOptions = useMemo(() => {
    const term = restaurantQuery.trim().toLowerCase();
    if (!term) return restaurantOptions;
    return restaurantOptions.filter((r) => r.name.toLowerCase().includes(term) || r.id.endsWith(term));
  }, [restaurantOptions, restaurantQuery]);

  const selectedRestaurant = restaurantOptions.find((r) => r.id === restaurantId) ?? null;

  const shown = dishes.filter((d) => {
    if (restaurantId !== 'all' && d.restaurantId !== restaurantId) return false;
    const term = q.trim().toLowerCase();
    return !term || `${d.name} ${d.restaurantName}`.toLowerCase().includes(term);
  });

  const availableCount = dishes.filter((d) => d.available).length;

  async function change(d: Dish, field: 'available' | 'featured') {
    const next = !d[field];
    setBusyId(d.id);
    setDishes((prev) => prev.map((x) => (x.id === d.id ? { ...x, [field]: next } : x)));
    try {
      await api(`/api/admin/menu/${d.id}`, { method: 'PATCH', body: JSON.stringify({ [field]: next }) });
      if (field === 'available') onToast(`${d.name} ${next ? 'is available' : 'is unavailable'}`);
      else onToast(`${d.name} ${next ? 'is featured' : 'is no longer featured'}`);
    } catch (e) {
      setDishes((prev) => prev.map((x) => (x.id === d.id ? { ...x, [field]: !next } : x)));
      onToast((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function pickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFormError('');
    if (f && !IMAGE_TYPES.includes(f.type)) {
      setFormError('Photo must be a JPG, PNG or WebP image.');
      setFile(null);
      return;
    }
    if (f && f.size > MAX_IMAGE_BYTES) {
      setFormError('Photo must be under 3 MB.');
      setFile(null);
      return;
    }
    setFile(f);
  }

  function closeForm() {
    setAdding(false);
    setFormError('');
    setFile(null);
    setForm(EMPTY_FORM);
  }

  async function addDish(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.restaurantId) return setFormError('Pick a restaurant.');
    if (!form.name.trim()) return setFormError('Enter a name.');
    if (!(Number(form.price) > 0)) return setFormError('Enter a price above 0.');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('restaurantId', form.restaurantId);
      fd.append('name', form.name.trim());
      fd.append('description', '');
      fd.append('category', form.category);
      fd.append('prepTime', form.prepTime);
      fd.append('price', form.price);
      fd.append('veg', String(form.type === 'veg'));
      fd.append('available', String(form.available));
      if (file) fd.append('image', file);

      const token = localStorage.getItem(TOKEN_KEY) ?? '';
      const res = await fetch(`${API_URL}/api/admin/menu`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Could not add the item (${res.status})`);

      onToast(`${form.name.trim()} added`);
      closeForm();
      await load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.view}>
      <div className={styles.pagehead}>
        <div>
          <h1 className={styles.title}>Food items</h1>
          <p className={styles.sub}>
            {dishes.length ? `${availableCount} of ${dishes.length} dishes available right now.` : 'Manage your menu, prices and availability.'}
          </p>
        </div>
        <button type="button" style={orangeBtn} onClick={() => (adding ? closeForm() : setAdding(true))}>
          {adding ? 'Close' : '+ Add food item'}
        </button>
      </div>

      {adding && (
        <form onSubmit={addDish} className={styles.card} style={{ padding: 28, marginBottom: 24, display: 'grid', gap: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 22, color: 'var(--ink)' }}>New food item</h2>
            <button type="button" onClick={closeForm} aria-label="Close" style={{ ...outlineBtn, padding: '6px 12px' }}>
              ✕
            </button>
          </div>

          <label style={fieldLabel}>
            Restaurant
            <select
              value={form.restaurantId}
              onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}
              style={fieldInput}
            >
              <option value="">Choose a restaurant</option>
              {restaurantOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.id.slice(-4)}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldLabel}>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={fieldInput} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <label style={fieldLabel}>
              Category
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={fieldInput}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label style={fieldLabel}>
              Price (₹)
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                style={fieldInput}
              />
            </label>
            <label style={fieldLabel}>
              Prep time (min)
              <input
                type="number"
                min="1"
                value={form.prepTime}
                onChange={(e) => setForm({ ...form, prepTime: e.target.value })}
                style={fieldInput}
              />
            </label>
            <label style={fieldLabel}>
              Type
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'veg' | 'nonveg' })}
                style={fieldInput}
              >
                <option value="veg">Vegetarian</option>
                <option value="nonveg">Non-vegetarian</option>
              </select>
            </label>
          </div>

          <label style={fieldLabel}>
            Photo (optional, JPG, PNG or WebP, under 3 MB)
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} style={fieldInput} />
          </label>

          {formError && <div className={styles.error}>{formError}</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" style={{ ...orangeBtn, opacity: saving ? 0.6 : 1 }} disabled={saving}>
              {saving ? 'Saving…' : 'Add item'}
            </button>
            <button type="button" style={outlineBtn} onClick={closeForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={styles.card} style={{ padding: 16, marginBottom: 16, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="search"
            value={restaurantQuery}
            onChange={(e) => setRestaurantQuery(e.target.value)}
            placeholder={`Find a restaurant (${restaurantOptions.length})`}
            aria-label="Find a restaurant"
            style={{ ...filterInput, flex: '1 1 220px' }}
          />
          <select
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            aria-label="Restaurant"
            style={{ ...filterInput, flex: '1 1 280px' }}
          >
            <option value="all">All restaurants</option>
            {visibleOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.id.slice(-4)} ({r.count} dishes)
              </option>
            ))}
          </select>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dish name"
            aria-label="Search dishes"
            style={{ ...filterInput, flex: '1 1 220px' }}
          />
        </div>

        {selectedRestaurant && (
          <div>
            <span style={pill}>
              {selectedRestaurant.name} · {shown.length} dishes
              <button
                type="button"
                onClick={() => setRestaurantId('all')}
                aria-label="Clear restaurant filter"
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 15, padding: 0 }}
              >
                ✕
              </button>
            </span>
          </div>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card}>
        {shown.length === 0 && !error ? (
          <div className={styles.empty}>No dishes match these filters.</div>
        ) : (
          <div className={styles.tw}>
            <table>
              <thead>
                <tr>
                  <th>Dish</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Available</th>
                  <th>Featured</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className={styles.dishName}>{d.name}</div>
                      <div className={styles.dishSub}>{d.restaurantName}</div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${d.veg ? styles.vegTag : styles.nonTag}`}>
                        {d.veg ? 'Veg' : 'Non-veg'}
                      </span>
                    </td>
                    <td className={styles.num}>{inr(d.price)}</td>
                    <td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={d.available}
                        aria-label={`${d.name} available`}
                        className={`${styles.switch} ${d.available ? styles.switchOn : ''}`}
                        disabled={busyId === d.id}
                        onClick={() => change(d, 'available')}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={d.featured}
                        aria-label={`${d.name} featured`}
                        className={`${styles.switch} ${d.featured ? styles.switchOn : ''}`}
                        disabled={busyId === d.id}
                        onClick={() => change(d, 'featured')}
                      />
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