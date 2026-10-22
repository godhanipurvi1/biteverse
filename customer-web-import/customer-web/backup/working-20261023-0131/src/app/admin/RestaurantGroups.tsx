'use client';

import { useMemo, useState } from 'react';
import styles from './restaurantGroups.module.css';

type Props = {
  items: string[];
  active: string;
  onPick: (name: string) => void;
  allLabel?: string;
};

export default function RestaurantGroups({ items, active, onPick, allLabel = 'All restaurants' }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const name of items) {
      const brand = name.split(' ')[0];
      if (!map.has(brand)) map.set(brand, []);
      map.get(brand)!.push(name);
    }
    return [...map.entries()]
      .map(([brand, list]) => ({ brand, list: [...list].sort((a, b) => a.localeCompare(b)) }))
      .sort((a, b) => a.brand.localeCompare(b.brand));
  }, [items]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? groups
        .map((g) => ({ ...g, list: g.list.filter((n) => n.toLowerCase().includes(q)) }))
        .filter((g) => g.list.length > 0)
    : groups;

  const activeBrand = active === allLabel ? '' : active.split(' ')[0];
  const isOpen = (brand: string) => (q ? true : brand in open ? open[brand] : brand === activeBrand);

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search restaurants"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          aria-label="Search restaurants"
        />
        <button
          type="button"
          className={`${styles.chip} ${active === allLabel ? styles.chipOn : ''}`}
          onClick={() => onPick(allLabel)}
        >
          {allLabel}
        </button>
      </div>

      {visible.map((g) => {
        const expanded = isOpen(g.brand);
        return (
          <section key={g.brand} className={styles.group}>
            <button
              type="button"
              className={styles.groupHead}
              aria-expanded={expanded}
              onClick={() => setOpen((o) => ({ ...o, [g.brand]: !expanded }))}
            >
              <span className={styles.brand}>{g.brand}</span>
              <span className={styles.count}>{g.list.length} outlets</span>
              <span className={styles.caret}>{expanded ? '−' : '+'}</span>
            </button>
            {expanded && (
              <div className={styles.outlets}>
                {g.list.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`${styles.chip} ${active === n ? styles.chipOn : ''}`}
                    onClick={() => onPick(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {visible.length === 0 && <p className={styles.empty}>No restaurants match "{query}".</p>}
    </div>
  );
}
