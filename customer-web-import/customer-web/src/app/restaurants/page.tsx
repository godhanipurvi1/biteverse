"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Shell from "../../components/Shell";
import styles from "./restaurants.module.css";

type RawRestaurant = Record<string, unknown>;

type Restaurant = {
  id: string;
  name: string;
  cuisines: string[];
  rating: number | null;
  timeLabel: string;
  costForTwo: number | null;
  isOpen: boolean;
  offer: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const FILTERS = ["All", "Thali", "Biryani", "Pizza", "Burgers", "Chinese", "Healthy", "Desserts"];
const PALETTE = ["var(--tint-a)", "var(--tint-c)", "var(--tint-a)", "var(--tint-c)", "var(--tint-d)", "var(--tint-b)"];

function toNumber(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

// Accepts the field names the API may use and ignores anything it can't read.
function normalize(raw: RawRestaurant): Restaurant | null {
  const id = String(raw._id ?? raw.id ?? "");
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!id || !name) return null;

  let timeLabel = "30–40 min";
  if (typeof raw.deliveryTime === "string" && raw.deliveryTime.trim()) {
    timeLabel = raw.deliveryTime.trim();
  } else if (typeof raw.deliveryTime === "number") {
    timeLabel = `${raw.deliveryTime} min`;
  }

  // Prices may be stored in rupees (costForTwo) or paise (costForTwoInr).
  let costForTwo = toNumber(raw.costForTwo);
  if (costForTwo === null) {
    const paise = toNumber(raw.costForTwoInr);
    if (paise !== null) costForTwo = paise / 100;
  }

  return {
    id,
    name,
    cuisines: toStringArray(raw.categories ?? raw.cuisines ?? raw.cuisine),
    rating: toNumber(raw.rating),
    timeLabel,
    costForTwo,
    isOpen: raw.isOpen !== false,
    offer: typeof raw.offerLabel === "string" && raw.offerLabel.trim() ? raw.offerLabel.trim() : null,
  };
}

function iconFor(cuisines: string[]): string {
  const c = cuisines.join(" ").toLowerCase();
  if (c.includes("thali")) return "🍛";
  if (c.includes("biryani") || c.includes("mughlai")) return "🍚";
  if (c.includes("pizza")) return "🍕";
  if (c.includes("burger")) return "🍔";
  if (c.includes("chinese")) return "🥡";
  if (c.includes("healthy") || c.includes("salad")) return "🥗";
  if (c.includes("dessert")) return "🧁";
  return "🍽️";
}

function HeartIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={on ? "#ff7a33" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 21s-7-4.35-9.5-8.5C.9 9.6 2.4 5.5 6.2 5.1 8.3 4.9 10.6 6 12 8c1.4-2 3.7-3.1 5.8-2.9 3.8.4 5.3 4.5 3.7 7.4C19 16.65 12 21 12 21z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="#f5b301" aria-hidden="true">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function RestaurantsPage() {
  const [items, setItems] = useState<Restaurant[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [filter, setFilter] = useState("All");
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/restaurants`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((json: unknown) => {
        let list: unknown[] = [];
        if (Array.isArray(json)) list = json;
        else if (json && typeof json === "object" && Array.isArray((json as { data?: unknown }).data)) {
          list = (json as { data: unknown[] }).data;
        }
        const parsed = list
          .map((x) => normalize((x ?? {}) as RawRestaurant))
          .filter((x): x is Restaurant => x !== null);
        setItems(parsed);
        setStatus("ready");
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, []);

  const visible = useMemo(() => {
    if (filter === "All") return items;
    const f = filter.toLowerCase();
    return items.filter((r) => r.cuisines.some((c) => c.toLowerCase().includes(f)));
  }, [items, filter]);

  function toggleFav(id: string) {
    setFavs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <Shell>
      <div className={styles.wrap}>
        <h1 className={styles.title}>Popular near you</h1>
        <p className={styles.sub}>Pick a cuisine to filter. Tap the heart to save a favourite.</p>

        <div className={styles.chips} role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`${styles.chip} ${filter === f ? styles.chipActive : ""}`}
              onClick={() => setFilter(f)}
              role="tab"
              aria-selected={filter === f}
            >
              {f}
            </button>
          ))}
        </div>

        {status === "loading" && <p className={styles.muted}>Loading restaurants…</p>}
        {status === "error" && (
          <p className={styles.errorBox}>Couldn&apos;t load restaurants. Check that the backend is running.</p>
        )}
        {status === "ready" && visible.length === 0 && (
          <p className={styles.muted}>No restaurants match this cuisine.</p>
        )}

        <div className={styles.grid}>
          {visible.map((r, i) => {
            const isFav = favs.includes(r.id);
            return (
              <article key={r.id} className={styles.card}>
                <div className={styles.hero} style={{ background: PALETTE[i % PALETTE.length] }}>
                  <span className={styles.emoji} aria-hidden="true">{iconFor(r.cuisines)}</span>

                  <button
                    className={styles.heart}
                    onClick={() => toggleFav(r.id)}
                    aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
                    aria-pressed={isFav}
                  >
                    <HeartIcon on={isFav} />
                  </button>

                  {r.offer && <span className={styles.badge}>{r.offer}</span>}
                </div>

                <div className={styles.body}>
                  <h2 className={styles.name}>{r.name}</h2>
                  <p className={styles.cuisine}>{r.cuisines.join(", ") || "Restaurant"}</p>

                  <div className={styles.meta}>
                    <span className={styles.metaItem}>
                      <StarIcon /> {r.rating !== null ? r.rating.toFixed(1) : "New"}
                    </span>
                    <span className={styles.metaItem}>
                      <ClockIcon /> {r.timeLabel}
                    </span>
                    {r.costForTwo !== null && (
                      <span className={styles.metaItem}>₹{Math.round(r.costForTwo)} for two</span>
                    )}
                  </div>

                  <Link
                    href={`/restaurant/${r.id}`}
                    className={styles.viewBtn}
                    aria-disabled={!r.isOpen}
                    tabIndex={r.isOpen ? 0 : -1}
                    onClick={(e) => {
                      if (!r.isOpen) e.preventDefault();
                    }}
                  >
                    View menu
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
