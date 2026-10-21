"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./favorites.module.css";

type FavRestaurant = {
  id: string;
  slug: string;
  name: string;
  cuisines: string[];
  rating: number | null;
  deliveryMinutes: number | null;
  priceForTwoPaise: number | null;
  imageUrl: string | null;
};

export default function FavoritesPage() {
  const [tab, setTab] = useState<"restaurants" | "dishes">("restaurants");
  const [items, setItems] = useState<FavRestaurant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/favorites", { credentials: "include" })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error?.code ?? "REQUEST_FAILED");
        return body;
      })
      .then((body) => {
        if (alive) setItems(body.items);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function remove(id: string) {
    const previous = items;
    setItems((cur) => (cur ? cur.filter((i) => i.id !== id) : cur));
    const res = await fetch(`/api/favorites/restaurant/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) setItems(previous);
  }

  function renderBody() {
    if (tab === "dishes") {
      return <div className={styles.empty}>Dish favorites are coming soon.</div>;
    }
    if (error === "UNAUTHENTICATED") {
      return (
        <div className={styles.empty}>
          <Link href="/login">Log in</Link> to see your favorites.
        </div>
      );
    }
    if (error) {
      return <div className={styles.empty}>Could not load your favorites. Try again.</div>;
    }
    if (items === null) {
      return <div className={styles.empty}>Loading your favorites...</div>;
    }
    if (items.length === 0) {
      return (
        <div className={styles.empty}>
          No favorite restaurants yet. <Link href="/restaurants">Browse restaurants</Link>
        </div>
      );
    }
    return (
      <div className={styles.grid}>
        {items.map((r) => (
          <article key={r.id} className={styles.card}>
            <Link href={`/restaurants/${r.slug}`} className={styles.art} aria-label={r.name}>
              {r.imageUrl ? <img src={r.imageUrl} alt="" /> : null}
            </Link>
            <div className={styles.body}>
              <h3 className={styles.name}>{r.name}</h3>
              <p className={styles.meta}>{r.cuisines.join(", ")}</p>
              <div className={styles.stats}>
                {r.rating !== null && <span>{"\u2605"} {r.rating.toFixed(1)}</span>}
                {r.deliveryMinutes !== null && <span>{r.deliveryMinutes} min</span>}
                {r.priceForTwoPaise !== null && (
                  <span>{"\u20B9"}{Math.round(r.priceForTwoPaise / 100)} for two</span>
                )}
              </div>
              <button className={styles.remove} type="button" onClick={() => remove(r.id)}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Favorites</h1>
      <p className={styles.sub}>Your saved restaurants and dishes</p>

      <div className={styles.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={tab === "restaurants"}
          className={tab === "restaurants" ? `${styles.tab} ${styles.tabOn}` : styles.tab}
          onClick={() => setTab("restaurants")}
          type="button"
        >
          Restaurants
        </button>
        <button
          role="tab"
          aria-selected={tab === "dishes"}
          className={tab === "dishes" ? `${styles.tab} ${styles.tabOn}` : styles.tab}
          onClick={() => setTab("dishes")}
          type="button"
        >
          Dishes
        </button>
      </div>

      {renderBody()}
    </div>
  );
}
