"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getRestaurants } from "@/features/restaurant/restaurant.api";
import shared from "@/features/restaurant/restaurants.module.css";
import styles from "@/features/explore/explore.module.css";

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
  isVeg?: boolean;
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

export default function ExplorePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [maxTime, setMaxTime] = useState(0);
  const [freeOnly, setFreeOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    getRestaurants()
      .then((data: Restaurant[]) => {
        if (alive) setRestaurants(data);
      })
      .catch((err) => {
        console.error("Error fetching restaurants:", err);
        if (alive) setError("Could not load restaurants");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

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
      if (freeOnly && !r.freeDelivery) return false;
      if (discountOnly && !r.discountPercent) return false;
      if (vegOnly && r.isVeg !== true) return false;
      return true;
    });
  }, [restaurants, query, cuisine, minRating, maxTime, freeOnly, discountOnly, vegOnly]);

  useEffect(() => {
    setPage(1);
  }, [query, cuisine, minRating, maxTime, freeOnly, discountOnly, vegOnly]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const isFiltered =
    query || cuisine !== "All" || minRating > 0 || maxTime > 0 || freeOnly || discountOnly || vegOnly;

  const clearAll = () => {
    setInput("");
    setQuery("");
    setCuisine("All");
    setMinRating(0);
    setMaxTime(0);
    setFreeOnly(false);
    setDiscountOnly(false);
    setVegOnly(false);
  };

  return (
    <section className={shared.page}>
      <h1 className={styles.title}>Explore your next favorite meal</h1>
      <p className={styles.subtitle}>Search restaurants, discover delicious food, and find something amazing.</p>

      <form
        className={styles.bar}
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(input);
        }}
      >
        <span aria-hidden>🔍</span>
        <input
          type="search"
          placeholder="Search restaurants, dishes, or cuisines..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setQuery(e.target.value);
          }}
        />
        <button type="submit" className={styles.searchBtn}>
          Search
        </button>
      </form>

      <div className={shared.chips}>
        {cuisines.map((c) => (
          <button
            key={c}
            className={`${shared.chip} ${cuisine === c ? shared.chipActive : ""}`}
            onClick={() => setCuisine(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className={shared.layout}>
        <aside className={shared.sidebar}>
          <div className={shared.sidebarHead}>
            <span>Filters</span>
            {isFiltered && (
              <button className={shared.clear} onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>

          <div className={shared.group}>
            <p className={shared.groupTitle}>Minimum rating</p>
            {RATING_OPTIONS.map((o) => (
              <label key={o.label} className={shared.option}>
                <input type="radio" name="rating" checked={minRating === o.value} onChange={() => setMinRating(o.value)} />
                {o.label}
              </label>
            ))}
          </div>

          <div className={shared.group}>
            <p className={shared.groupTitle}>Delivery time</p>
            {TIME_OPTIONS.map((o) => (
              <label key={o.label} className={shared.option}>
                <input type="radio" name="time" checked={maxTime === o.value} onChange={() => setMaxTime(o.value)} />
                {o.label}
              </label>
            ))}
          </div>

          <div className={shared.group}>
            <p className={shared.groupTitle}>Quick filters</p>
            <div className={styles.toggleRow}>
              <span>Vegetarian only</span>
              <button
                className={`${styles.switch} ${vegOnly ? styles.switchOn : ""}`}
                onClick={() => setVegOnly(!vegOnly)}
                aria-pressed={vegOnly}
                aria-label="Vegetarian only"
              />
            </div>
            <label className={shared.option}>
              <input type="checkbox" checked={discountOnly} onChange={(e) => setDiscountOnly(e.target.checked)} />
              Discount offers
            </label>
            <label className={shared.option}>
              <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />
              Free delivery
            </label>
          </div>
        </aside>

        <div>
          {loading && <div className={shared.state}>Loading restaurants...</div>}
          {error && <div className={shared.state}>{error}</div>}

          {!loading && !error && filtered.length === 0 && (
            <div className={shared.state}>
              No restaurants match these filters.{" "}
              <button className={shared.clear} onClick={clearAll}>
                Clear filters
              </button>
            </div>
          )}

          {!loading && !error && visible.length > 0 && (
            <>
              <p className={shared.subtitle} style={{ marginBottom: "1rem" }}>
                {filtered.length} {filtered.length === 1 ? "place" : "places"} found
              </p>
              <div className={shared.grid}>
                {visible.map((r) => (
                  <article key={r._id} className={shared.card}>
                    <div className={shared.media}>
                      {r.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.imageUrl} alt={r.name} />
                      ) : (
                        <span aria-hidden>{r.name.charAt(0)}</span>
                      )}
                      {r.discountPercent ? (
                        <span className={shared.badgeOff}>{r.discountPercent}% OFF</span>
                      ) : null}
                    </div>
                    <div className={shared.body}>
                      <h2 className={shared.name}>{r.name}</h2>
                      {typeof r.rating === "number" && r.rating > 0 && (
                        <div className={shared.meta}>
                          <span className={shared.star}>★ {r.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {r.cuisine && r.cuisine.length > 0 && (
                        <p className={shared.cuisine}>{r.cuisine.join(" • ")}</p>
                      )}
                      {r.deliveryMinutes ? (
                        <div className={shared.info}>
                          <span>🕒 {r.deliveryMinutes} mins</span>
                        </div>
                      ) : null}
                      {r.freeDelivery && <span className={shared.freeDelivery}>Free delivery</span>}
                    </div>
                    <Link href={`/restaurants/${r.slug}`} className={shared.cta}>
                      View restaurant →
                    </Link>
                  </article>
                ))}
              </div>

              {pageCount > 1 && (
                <nav className={shared.pager} aria-label="Pagination">
                  <button className={shared.pageBtn} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                    ‹ Previous
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      className={`${shared.pageBtn} ${n === currentPage ? shared.pageBtnActive : ""}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button className={shared.pageBtn} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
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