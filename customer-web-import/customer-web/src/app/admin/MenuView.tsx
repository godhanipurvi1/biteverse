'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './admin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
// Keep in sync with TOKEN_KEY in page.tsx.
const TOKEN_KEY = 'biteverse-token';

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

export default function MenuView({ onToast }: { onToast: (m: string) => void }) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [q, setQ] = useState('');
  const [restaurant, setRestaurant] = useState('all');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const restaurants = useMemo(
    () => Array.from(new Set(dishes.map((d) => d.restaurantName))).sort(),
    [dishes]
  );

  const shown = dishes.filter((d) => {
    if (restaurant !== 'all' && d.restaurantName !== restaurant) return false;
    const term = q.trim().toLowerCase();
    return !term || `${d.name} ${d.restaurantName}`.toLowerCase().includes(term);
  });

  const availableCount = dishes.filter((d) => d.available).length;

  async function change(d: Dish, field: 'available' | 'featured') {
    const next = !d[field];
    setBusyId(d.id);
    // Update the screen straight away; put it back if the server refuses.
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

  return (
    <div className={styles.view}>
      <div className={styles.pagehead}>
        <div>
          <h1 className={styles.title}>Food items</h1>
          <p className={styles.sub}>
            {dishes.length ? `${availableCount} of ${dishes.length} dishes available right now.` : 'Switch dishes on or off.'}
          </p>
        </div>
      </div>

      <div className={styles.chips}>
        {['all', ...restaurants].map((r) => (
          <button
            key={r}
            type="button"
            className={`${styles.chip} ${restaurant === r ? styles.chipOn : ''}`}
            onClick={() => setRestaurant(r)}
          >
            {r === 'all' ? 'All restaurants' : r}
          </button>
        ))}
      </div>

      <input
        className={styles.search}
        type="search"
        placeholder="Search dish or restaurant"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search dishes"
      />

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card}>
        {shown.length === 0 && !error ? (
          <div className={styles.empty}>No dishes match this search.</div>
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
