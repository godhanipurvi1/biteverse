"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthError } from "../../../lib/orders";
import { fetchFavorites, setFavorite } from "../../../lib/favorites";
import TopBar from "../../../components/TopBar";
import Sidebar from "../../../components/Sidebar";
import Toast from "../../../components/Toast";
import CartPanel from "../../../components/CartPanel";
import MenuSheet from "../../../components/MenuSheet";
import { useCart, saveCart, changeQty, groupByRestaurant, cartDeliveryFeeOf } from "../../../lib/cart";
import styles from "./favourites.module.css";

type Diet = "all" | "veg" | "nonveg";

type MenuItem = {
  _id: string;
  name: string;
  price: number; // rupees
  description?: string;
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
};

type Restaurant = {
  _id: string;
  name: string;
  address?: string;
  rating?: number;
  isOpen?: boolean;
  categories?: string[];
  deliveryMinutes?: number | { min?: number; max?: number };
  costForTwo?: number;
  offerLabel?: string;
  menu?: MenuItem[];
};

type RawRestaurant = Omit<Restaurant, "menu"> & { menu?: RawDish[] };

type RestaurantResponse = {
  success?: boolean;
  count?: number;
  data?: RawRestaurant[];
  message?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const TINTS = ["var(--tint-a)", "var(--tint-b)", "var(--tint-c)", "var(--tint-d)"];
const DESKTOP = "(min-width: 1024px)";
const DIETS: { value: Diet; label: string }[] = [
  { value: "all", label: "All" },
  { value: "veg", label: "Veg" },
  { value: "nonveg", label: "Non-veg" },
];

// Convert backend data into the shapes the menu popup expects (prices in rupees).
function toRestaurant(raw: RawRestaurant): Restaurant {
  return {
    ...raw,
    menu: (raw.menu ?? []).map((d) => ({
      _id: String(d._id ?? d.name),
      name: d.name,
      description: d.description,
      price: typeof d.priceInr === "number" ? d.priceInr / 100 : 0,
      veg: d.veg,
      available: d.available,
    })),
  };
}

function deliveryText(d: Restaurant["deliveryMinutes"]) {
  if (typeof d === "number") return `${d} min`;
  if (d && typeof d.min === "number" && typeof d.max === "number") return `${d.min}-${d.max} min`;
  return null;
}

export default function FavouritesPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diet, setDiet] = useState<Diet>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<Restaurant | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useCart();

  const cartCount = cart ? cart.lines.reduce((n, l) => n + l.qty, 0) : 0;
  const cartSubtotal = cart ? cart.lines.reduce((n, l) => n + l.qty * l.price, 0) : 0;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [favs, res] = await Promise.all([fetchFavorites(), fetch(`${API_URL}/api/restaurants`)]);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as RestaurantResponse;
        if (cancelled) return;
        setFavIds(favs.map((r) => String(r._id)));
        setRestaurants((json.data ?? []).map(toRestaurant));
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) setNeedsLogin(true);
        else setError("Could not load your favourites. Check that the backend is running on port 5000.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setNavOpen(false);
        setMenuFor(null);
        setCartOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function onMenu() {
    if (window.matchMedia(DESKTOP).matches) setCollapsed((c) => !c);
    else setNavOpen(true);
  }

  // Saved restaurants, filtered by the diet buttons.
  const saved = useMemo(() => {
    const ids = new Set(favIds);
    return restaurants.filter((r) => {
      if (!ids.has(String(r._id))) return false;
      if (diet === "all") return true;
      return (r.menu ?? []).some((m) => (diet === "veg" ? m.veg === true : m.veg === false));
    });
  }, [restaurants, favIds, diet]);

  async function removeFavourite(r: Restaurant) {
    const id = String(r._id);
    setFavIds((prev) => prev.filter((x) => x !== id));
    try {
      await setFavorite(id, false);
      setToast("Removed from favourites");
    } catch (err) {
      setFavIds((prev) => [...prev, id]);
      setToast(err instanceof AuthError ? "Log in to change favourites" : (err as Error).message);
    }
  }

  const showList = !loading && !needsLogin && !error;

  return (
    <>
      <TopBar onMenu={onMenu} cartCount={cartCount} onNotify={setToast} onOpenCart={() => setCartOpen(true)} />

      <div className={`shell ${collapsed ? "collapsed" : ""}`}>
        <Sidebar open={navOpen} collapsed={collapsed} onClose={() => setNavOpen(false)} cartCount={cartCount} />

        <main className="main container">
          <div className={styles.page}>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <a href="/#restaurants">Restaurants</a>
              <span aria-hidden="true">/</span>
              <strong>Favourites</strong>
            </nav>

            <header className={styles.head}>
              <div>
                <h1>Favourites</h1>
                <p className={styles.sub}>Restaurants you saved, ready when you are.</p>
              </div>
              {showList && <span className={styles.pill}>{saved.length} saved</span>}
            </header>

            {showList && favIds.length > 0 && (
              <div className={styles.diet} role="group" aria-label="Diet filter">
                {DIETS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    className={styles.dietBtn}
                    aria-pressed={diet === d.value}
                    onClick={() => setDiet(d.value)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            {loading && <p className={styles.note}>Loading your favourites...</p>}

            {!loading && needsLogin && (
              <div className={styles.empty}>
                <p>Log in to see your favourites.</p>
              </div>
            )}

            {!loading && error && (
              <div className={styles.empty}>
                <p className={styles.error}>{error}</p>
              </div>
            )}

            {showList && saved.length === 0 && (
              <div className={styles.empty}>
                <p>{favIds.length === 0 ? "You have no favourites yet." : "No favourites match this filter."}</p>
                <a className={styles.linkBtn} href="/#restaurants">
                  Browse restaurants
                </a>
              </div>
            )}

            {showList && saved.length > 0 && (
              <ul className={styles.list}>
                {saved.map((r, i) => {
                  const time = deliveryText(r.deliveryMinutes);
                  const cuisines = (r.categories ?? []).join(" \u00B7 ") || "Cuisine not set";
                  const dishCount = (r.menu ?? []).length;
                  return (
                    <li key={r._id} className={styles.row}>
                      <div className={styles.avatar} style={{ background: TINTS[i % TINTS.length] }}>
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.info}>
                        <h2>{r.name}</h2>
                        <p className={styles.cuisine}>{cuisines}</p>
                        <div className={styles.stats}>
                          {r.rating !== undefined && <span>{`\u2605 ${Number(r.rating).toFixed(1)}`}</span>}
                          {time && <span>{time}</span>}
                          {dishCount > 0 && <span>{`${dishCount} dishes`}</span>}
                          {r.isOpen === false && <span className={styles.closed}>Closed now</span>}
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.heart}
                          aria-label={`Remove ${r.name} from favourites`}
                          onClick={() => removeFavourite(r)}
                        >
                          {"\u2665"}
                        </button>
                        <button type="button" className={styles.menuBtn} onClick={() => setMenuFor(r)}>
                          View menu
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>
      </div>

      <MenuSheet restaurant={menuFor} onClose={() => setMenuFor(null)} onToast={setToast} />

      <CartPanel
        open={cartOpen}
        groups={groupByRestaurant(cart)}
        deliveryFee={cartDeliveryFeeOf(cart)}
        lines={cart?.lines ?? []}
        subtotal={cartSubtotal}
        onChange={changeQty}
        onClear={() => {
          saveCart(null);
          setCartOpen(false);
        }}
        onClose={() => setCartOpen(false)}
      />

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
