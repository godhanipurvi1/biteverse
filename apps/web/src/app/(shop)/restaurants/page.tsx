"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getRestaurants } from "@/features/restaurant/restaurant.api";
import styles from "@/features/restaurant/restaurants.module.css";

type Restaurant = {
  _id: string;
  slug: string;
  name: string;
  cuisine?: string[];
  rating?: number | null;
  deliveryMinutes?: number;
  imageUrl?: string;
  discountPercent?: number;
  freeDelivery?: boolean;
};

const PAGE_SIZE = 8;

const RATING_OPTIONS = [
  { label: "All ratings", value: 0 },
  { label: "4.5 & above", value: 4.5 },
  { label: "4.0 & above", value: 4.0 },
  { label: "3.5 & above", value: 3.5 },
];

const TIME_OPTIONS = [
  { label: "Any time", value: 0 },
  { label: "Within 30 mins", value: 30 },
  { label: "30 – 45 mins", value: 45 },
  { label: "45 – 60 mins", value: 60 },
];

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [maxTime, setMaxTime] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    getRestaurants()
      .then((data: Restaurant[]) => {
        if (alive) setRestaurants(data);
      })
      .catch((err) => {
        console.error("Error fetching restaurants:", err);
        if (alive) setError("Failed to load restaurants");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Cuisine chips come from the data, so they always match what exists
  const cuisines = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => r.cuisine?.forEach((c) => set.add(c)));
    return ["All", ...Array.from(set).sort()];
  }, [restaurants]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return restaurants.filter((r) => {
      if (q) {
        const haystack = [r.name, ...(r.cuisine ?? [])].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (cuisine !== "All" && !(r.cuisine ?? []).includes(cuisine)) return false;
      if (minRating > 0 && (r.rating ?? 0) < minRating) return false;
      if (maxTime > 0 && (r.deliveryMinutes ?? Infinity) > maxTime) return false;
      return true;
    });
  }, [restaurants, query, cuisine, minRating, maxTime]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [query, cuisine, minRating, maxTime]);

  const clearAll = () => {
    setQuery("");
    setCuisine("All");
    setMinRating(0);
    setMaxTime(0);
  };

  const isFiltered = query || cuisine !== "All" || minRating > 0 || maxTime > 0;

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Restaurants</h1>
          <p className={styles.subtitle}>Discover the best restaurants near you.</p>
        </div>
        <label className={styles.search}>
          <span aria-hidden>🔍</span>
          <input
            type="search"
            placeholder="Search restaurants, cuisines, or dishes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className={styles.chips}>
        {cuisines.map((c) => (
          <button
            key={c}
            className={`${styles.chip} ${cuisine === c ? styles.chipActive : ""}`}
            onClick={() => setCuisine(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHead}>
            <span>Filters</span>
            {isFiltered && (
              <button className={styles.clear} onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>

          <div className={styles.group}>
            <p className={styles.groupTitle}>Ratings</p>
            {RATING_OPTIONS.map((o) => (
              <label key={o.label} className={styles.option}>
                <input
                  type="radio"
                  name="rating"
                  checked={minRating === o.value}
                  onChange={() => setMinRating(o.value)}
                />
                {o.label}
              </label>
            ))}
          </div>

          <div className={styles.group}>
            <p className={styles.groupTitle}>Delivery time</p>
            {TIME_OPTIONS.map((o) => (
              <label key={o.label} className={styles.option}>
                <input
                  type="radio"
                  name="time"
                  checked={maxTime === o.value}
                  onChange={() => setMaxTime(o.value)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </aside>

        <div>
          {loading && <div className={styles.state}>Loading restaurants...</div>}
          {error && <div className={styles.state}>{error}</div>}

          {!loading && !error && filtered.length === 0 && (
            <div className={styles.state}>
              No restaurants match these filters.{" "}
              <button className={styles.clear} onClick={clearAll}>
                Clear filters
              </button>
            </div>
          )}

          {!loading && !error && visible.length > 0 && (
            <>
              <p className={styles.subtitle} style={{ marginBottom: "1rem" }}>
                {filtered.length} {filtered.length === 1 ? "place" : "places"} found
              </p>
              <div className={styles.grid}>
                {visible.map((r) => (
                  <article key={r._id} className={styles.card}>
                    <div className={styles.media}>
                      {r.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.imageUrl} alt={r.name} />
                      ) : (
                        <span aria-hidden>{r.name.charAt(0)}</span>
                      )}
                      {r.discountPercent ? (
                        <span className={styles.badgeOff}>{r.discountPercent}% OFF</span>
                      ) : null}
                    </div>

                    <div className={styles.body}>
                      <h2 className={styles.name}>{r.name}</h2>
                      {typeof r.rating === "number" && r.rating > 0 && (
                        <div className={styles.meta}>
                          <span className={styles.star}>★ {r.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {r.cuisine && r.cuisine.length > 0 && (
                        <p className={styles.cuisine}>{r.cuisine.join(" • ")}</p>
                      )}
                      {r.deliveryMinutes ? (
                        <div className={styles.info}>
                          <span>🕒 {r.deliveryMinutes} mins</span>
                        </div>
                      ) : null}
                      {r.freeDelivery && <span className={styles.freeDelivery}>Free delivery</span>}
                    </div>

                    <Link href={`/restaurants/${r.slug}`} className={styles.cta}>
                      View menu →
                    </Link>
                  </article>
                ))}
              </div>

              {pageCount > 1 && (
                <nav className={styles.pager} aria-label="Pagination">
                  <button
                    className={styles.pageBtn}
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    ‹ Previous
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      className={`${styles.pageBtn} ${n === currentPage ? styles.pageBtnActive : ""}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    className={styles.pageBtn}
                    disabled={currentPage === pageCount}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next ›
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}