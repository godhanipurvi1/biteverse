"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AuthError } from "../../../lib/orders";
import { fetchFavorites, setFavorite } from "../../../lib/favorites";
import TopBar from "../../../components/TopBar";
import Sidebar from "../../../components/Sidebar";
import Toast from "../../../components/Toast";
import CartPanel from "../../../components/CartPanel";
import {
  useCart,
  saveCart,
  addToCart,
  changeQty,
  cartCountOf,
  cartSubtotalOf,
  groupByRestaurant,
  cartDeliveryFeeOf,
} from "../../../lib/cart";
import styles from "./restaurant.module.css";
import { getRestaurantCache } from "../../../lib/restaurantCache";

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
  rating?: number;
  isOpen?: boolean;
  categories?: string[];
  deliveryMinutes?: number | { min?: number; max?: number };
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
const DESKTOP = "(min-width: 1024px)";

// Convert backend data into the shapes the cart and menu use (prices in rupees).
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

export default function RestaurantPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [favIds, setFavIds] = useState<string[]>([]);
  const [vegOnly, setVegOnly] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useCart();

  const cartCount = cartCountOf(cart);
  const cartSubtotal = cartSubtotalOf(cart);

  useEffect(() => {
    let cancelled = false;
    const cachedList = getRestaurantCache<RawRestaurant>();
    const cachedHit = cachedList?.map(toRestaurant).find((r) => String(r._id) === id);
    if (cachedHit) {
      setRestaurant(cachedHit);
      setStatus("ready");
    } else fetch(`${API_URL}/api/restaurants`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<RestaurantResponse>;
      })
      .then((json) => {
        if (cancelled) return;
        const found = (json.data ?? []).map(toRestaurant).find((r) => String(r._id) === id);
        setRestaurant(found ?? null);
        setStatus(found ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    fetchFavorites()
      .then((list) => {
        if (!cancelled) setFavIds(list.map((r) => String(r._id)));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setNavOpen(false);
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

  const isFav = restaurant ? favIds.includes(String(restaurant._id)) : false;

  async function toggleFav() {
    if (!restaurant) return;
    const rid = String(restaurant._id);
    const added = !favIds.includes(rid);
    setFavIds((prev) => (added ? [...prev, rid] : prev.filter((x) => x !== rid)));
    try {
      await setFavorite(rid, added);
      setToast(added ? "Saved to favourites" : "Removed from favourites");
    } catch (err) {
      setFavIds((prev) => (added ? prev.filter((x) => x !== rid) : [...prev, rid]));
      setToast(err instanceof AuthError ? "Log in to save favourites" : (err as Error).message);
    }
  }

  const dishes = useMemo(
    () => (restaurant?.menu ?? []).filter((m) => !vegOnly || m.veg === true),
    [restaurant, vegOnly]
  );

  const qtyOf = (dishId: string) => {
    if (!restaurant) return 0;
    return cart?.lines.find((l) => l.id === dishId && l.restaurantId === restaurant._id)?.qty ?? 0;
  };

  function add(m: MenuItem) {
    if (!restaurant) return;
    addToCart(restaurant, m);
    setToast(`Added ${m.name}`);
  }

  return (
    <>
      <TopBar onMenu={onMenu} cartCount={cartCount} onNotify={setToast} onOpenCart={() => setCartOpen(true)} />

      <div className={`shell ${collapsed ? "collapsed" : ""}`}>
        <Sidebar open={navOpen} collapsed={collapsed} onClose={() => setNavOpen(false)} />

        <main className="main container">
          <div className={styles.page}>
            {status === "loading" && <p className={styles.note}>Loading restaurant...</p>}

            {status === "error" && (
              <p className={styles.note}>Could not load this restaurant. Check that the backend is running on port 5000.</p>
            )}

            {status === "missing" && (
              <div className={styles.note}>
                <p>This restaurant could not be found.</p>
                <a className={styles.linkBtn} href="/#restaurants">
                  Back to restaurants
                </a>
              </div>
            )}

            {status === "ready" && restaurant && (
              <>
                <nav className={styles.crumbs} aria-label="Breadcrumb">
                  <a href="/#restaurants">Restaurants</a>
                  <span aria-hidden="true">/</span>
                  <strong>{restaurant.name}</strong>
                </nav>

                <header className={styles.hero}>
                  <div className={styles.tile} aria-hidden="true">
                    {restaurant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.heroText}>
                    <h1>{restaurant.name}</h1>
                    <p className={styles.cuisine}>{(restaurant.categories ?? []).join(", ") || "Cuisine not set"}</p>
                    <div className={styles.pills}>
                      {restaurant.rating !== undefined && (
                        <span>{`\u2605 ${Number(restaurant.rating).toFixed(1)} rating`}</span>
                      )}
                      {deliveryText(restaurant.deliveryMinutes) && (
                        <span>{deliveryText(restaurant.deliveryMinutes)}</span>
                      )}
                      <span>{"Free delivery over \u20B9249"}</span>
                      {restaurant.isOpen === false && <span className={styles.closed}>Closed now</span>}
                    </div>
                  </div>
                  <div className={styles.heroActions}>
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
                    <button
                      type="button"
                      className={styles.heart}
                      aria-pressed={isFav}
                      aria-label={
                        isFav ? `Remove ${restaurant.name} from favourites` : `Save ${restaurant.name} to favourites`
                      }
                      onClick={toggleFav}
                    >
                      {isFav ? "\u2665" : "\u2661"}
                    </button>
                  </div>
                </header>

                <div className={styles.tabs}>
                  <span className={styles.tabOn}>
                    Menu <span className={styles.count}>{dishes.length}</span>
                  </span>
                </div>

                {dishes.length === 0 ? (
                  <p className={styles.note}>
                    {(restaurant.menu ?? []).length > 0 ? "No veg dishes on this menu." : "Menu not available yet."}
                  </p>
                ) : (
                  <ul className={styles.grid}>
                    {dishes.map((m) => {
                      const q = qtyOf(m._id);
                      const unavailable = m.available === false;
                      return (
                        <li key={m._id} className={styles.item}>
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
                            {m.description && <p className={styles.desc}>{m.description}</p>}
                            <p className={styles.price}>{`\u20B9${m.price}`}</p>
                          </div>

                          <div className={styles.itemAction}>
                            {unavailable ? (
                              <span className={styles.unavailable}>Unavailable</span>
                            ) : q === 0 ? (
                              <button type="button" className={styles.addBtn} onClick={() => add(m)}>
                                Add
                              </button>
                            ) : (
                              <div className={styles.qty}>
                                <button
                                  type="button"
                                  onClick={() => changeQty(m._id, -1)}
                                  aria-label={`Remove one ${m.name}`}
                                >
                                  -
                                </button>
                                <span aria-live="polite">{q}</span>
                                <button type="button" onClick={() => add(m)} aria-label={`Add one ${m.name}`}>
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
              </>
            )}
          </div>
        </main>
      </div>

      {cartCount > 0 && (
        <div className={styles.cartBar}>
          <span>{`${cartCount} item${cartCount === 1 ? "" : "s"} \u00B7 \u20B9${cartSubtotal}`}</span>
          <button type="button" onClick={() => setCartOpen(true)}>
            View cart
          </button>
        </div>
      )}

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


