"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "../../components/Footer";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import Toast from "../../components/Toast";
import { useCart, addToCart, changeQty, cartCountOf, cartSubtotalOf } from "../../lib/cart";
import { getRestaurantCache } from "../../lib/restaurantCache";
import styles from "../restaurant/[id]/restaurant.module.css";
import menuStyles from "./menu.module.css";

type Dish = {
  _id: string;
  name: string;
  description?: string;
  price: number; // rupees
  veg?: boolean;
  available?: boolean;
};

type RawDish = {
  _id?: string;
  name: string;
  description?: string;
  priceInr?: number; // paise
  veg?: boolean;
  available?: boolean;
  isAvailable?: boolean;
};

type Restaurant = {
  _id: string;
  name: string;
  categories?: string[];
  isOpen?: boolean;
  menu?: Dish[];
};

type RawRestaurant = Omit<Restaurant, "menu"> & { menu?: RawDish[] };

type RestaurantResponse = { data?: RawRestaurant[] };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const DESKTOP = "(min-width: 1024px)";
const PAGE_SIZE = 60;

function toRestaurant(raw: RawRestaurant): Restaurant {
  return {
    ...raw,
    menu: (raw.menu ?? []).map((d) => ({
      _id: String(d._id ?? d.name),
      name: d.name,
      description: d.description,
      price: typeof d.priceInr === "number" ? d.priceInr / 100 : 0,
      veg: d.veg,
      available: d.available ?? d.isAvailable,
    })),
  };
}

function pretty(slug: string) {
  const s = slug.replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function MenuPage() {
  const router = useRouter();
  const cart = useCart();
  const cartCount = cartCountOf(cart);
  const cartSubtotal = cartSubtotalOf(cart);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [cuisine, setCuisine] = useState<string>("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [toast, setToast] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = getRestaurantCache<RawRestaurant>();
    if (cached) {
      setRestaurants(cached.map(toRestaurant));
      setStatus("ready");
    } else {
      fetch(`${API_URL}/api/restaurants`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<RestaurantResponse>;
        })
        .then((json) => {
          if (cancelled) return;
          setRestaurants((json.data ?? []).map(toRestaurant));
          setStatus("ready");
        })
        .catch(() => {
          if (!cancelled) setStatus("error");
        });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setNavOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [cuisine, vegOnly, q]);

  function onMenu() {
    if (window.matchMedia(DESKTOP).matches) setCollapsed((c) => !c);
    else setNavOpen(true);
  }

  const cuisines = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => (r.categories ?? []).forEach((c) => set.add(c)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [restaurants]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out: { dish: Dish; restaurant: Restaurant }[] = [];
    for (const r of restaurants) {
      if (cuisine !== "all" && !(r.categories ?? []).includes(cuisine)) continue;
      for (const d of r.menu ?? []) {
        if (vegOnly && d.veg !== true) continue;
        if (needle && !d.name.toLowerCase().includes(needle) && !r.name.toLowerCase().includes(needle)) continue;
        out.push({ dish: d, restaurant: r });
      }
    }
    return out;
  }, [restaurants, cuisine, vegOnly, q]);

  const shown = rows.slice(0, limit);

  const qtyOf = (dishId: string, restaurantId: string) =>
    cart?.lines.find((l) => l.id === dishId && l.restaurantId === restaurantId)?.qty ?? 0;

  function add(r: Restaurant, d: Dish) {
    addToCart(r, d);
    setToast(`Added ${d.name}`);
  }

  return (
    <>
      <TopBar onMenu={onMenu} cartCount={cartCount} onNotify={setToast} onOpenCart={() => router.push("/cart")} />

      <div className={`shell ${collapsed ? "collapsed" : ""}`}>
        <Sidebar open={navOpen} collapsed={collapsed} onClose={() => setNavOpen(false)} cartCount={cartCount} />

        <main className="main container">
          <div className={styles.page}>
            <h1 className={menuStyles.title}>Menu</h1>

            {status === "loading" && <p className={styles.note}>Loading dishes...</p>}
            {status === "error" && (
              <p className={styles.note}>Could not load the menu. Check that the backend is running on port 5000.</p>
            )}

            {status === "ready" && (
              <>
                <div className={menuStyles.controls}>
                  <div className={styles.search}>
                    <input
                      type="search"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search dishes or restaurants"
                      aria-label="Search dishes"
                    />
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={vegOnly}
                    className={styles.toggle}
                    onClick={() => setVegOnly((v) => !v)}
                  >
                    <span className={styles.knob} aria-hidden="true" />
                    Veg only
                  </button>
                </div>

                <div className={menuStyles.pills}>
                  <button
                    type="button"
                    className={cuisine === "all" ? `${menuStyles.pill} ${menuStyles.pillOn}` : menuStyles.pill}
                    onClick={() => setCuisine("all")}
                  >
                    All
                  </button>
                  {cuisines.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={cuisine === c ? `${menuStyles.pill} ${menuStyles.pillOn}` : menuStyles.pill}
                      onClick={() => setCuisine(c)}
                    >
                      {pretty(c)}
                    </button>
                  ))}
                </div>

                <p className={menuStyles.count}>{`${rows.length} dish${rows.length === 1 ? "" : "es"}`}</p>

                {rows.length === 0 ? (
                  <p className={styles.note}>No dishes match. Try another cuisine or clear the search.</p>
                ) : (
                  <ul className={styles.grid}>
                    {shown.map(({ dish: m, restaurant: r }) => {
                      const qty = qtyOf(m._id, r._id);
                      const unavailable = m.available === false;
                      return (
                        <li key={`${r._id}-${m._id}`} className={styles.item}>
                          <div className={styles.itemText}>
                            <div className={styles.nameRow}>
                              <span
                                role="img"
                                className={m.veg ? styles.dot : `${styles.dot} ${styles.dotNonveg}`}
                                title={m.veg ? "Veg" : "Non-veg"}
                                aria-label={m.veg ? "Veg" : "Non-veg"}
                              />
                              <h2>{m.name}</h2>
                            </div>
                            <a className={menuStyles.from} href={`/restaurant/${r._id}`}>{`from ${r.name}`}</a>
                            {m.description && <p className={styles.desc}>{m.description}</p>}
                            <p className={styles.price}>{`\u20B9${m.price}`}</p>
                          </div>

                          <div className={styles.itemAction}>
                            {unavailable ? (
                              <span className={styles.unavailable}>Unavailable</span>
                            ) : qty === 0 ? (
                              <button type="button" className={styles.addBtn} onClick={() => add(r, m)}>
                                Add
                              </button>
                            ) : (
                              <div className={styles.qty}>
                                <button type="button" onClick={() => changeQty(m._id, -1)} aria-label={`Remove one ${m.name}`}>
                                  -
                                </button>
                                <span aria-live="polite">{qty}</span>
                                <button type="button" onClick={() => add(r, m)} aria-label={`Add one ${m.name}`}>
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {rows.length > limit && (
                  <button type="button" className={menuStyles.more} onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                    {`Show more (${rows.length - limit} left)`}
                  </button>
                )}
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {cartCount > 0 && (
        <div className={styles.cartBar}>
          <span>{`${cartCount} item${cartCount === 1 ? "" : "s"} \u00B7 \u20B9${cartSubtotal}`}</span>
          <button type="button" onClick={() => router.push("/cart")}>
            View cart
          </button>
        </div>
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
