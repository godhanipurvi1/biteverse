"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "../../components/TopBar";
import Sidebar from "../../components/Sidebar";
import HeroScene from "../../components/HeroScene";
import Toast from "../../components/Toast";
import Offers from "../../components/Offers";
import LiveTracking from "../../components/LiveTracking";
import CartPanel from "../../components/CartPanel";
import { useCart, saveCart, changeQty, groupByRestaurant, cartDeliveryFeeOf } from "../../lib/cart";
import MenuSheet from "../../components/MenuSheet";

type MenuItem = { _id: string; name: string; price: number; description?: string };

type Restaurant = {
  _id: string;
  name: string;
  address?: string;
  rating?: number;
  isOpen?: boolean;
  categories?: string[];
  deliveryMinutes?: { min?: number; max?: number };
  costForTwo?: number;
  offerLabel?: string;
  menu?: MenuItem[];
};

type RestaurantResponse = {
  success?: boolean;
  count?: number;
  data?: Restaurant[];
  message?: string;
};


const WORDS = ["thali", "biryani", "pizza", "burgers", "noodles", "dessert"];
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const TINTS = ["var(--tint-a)", "var(--tint-b)", "var(--tint-c)", "var(--tint-d)"];
const DESKTOP = "(min-width: 1024px)";

function labelFor(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadStatus, setLoadStatus] = useState("Loading restaurants...");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [diet, setDiet] = useState<"all" | "veg" | "nonveg">("all");
  const [favourites, setFavourites] = useState<string[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<Restaurant | null>(null);

  const cartCount = cart ? cart.lines.reduce((n, l) => n + l.qty, 0) : 0;
  const cartSubtotal = cart ? cart.lines.reduce((n, l) => n + l.qty * l.price, 0) : 0;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setWordIndex((i) => (i + 1) % WORDS.length), 2200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/restaurants`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<RestaurantResponse>;
      })
      .then((json) => {
        const list = json.data ?? [];
        setRestaurants(list);
        setLoadStatus(list.length ? "" : "No restaurants are available yet.");
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setLoadStatus("Could not load restaurants. Check that the backend is running on port 5000.");
        }
      });
    return () => controller.abort();
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




  function toggleFavourite(r: Restaurant) {
    const added = !favourites.includes(r._id);
    setFavourites((prev) => (added ? [...prev, r._id] : prev.filter((x) => x !== r._id)));
    setToast(added ? "Saved to favourites" : "Removed from favourites");
  }

  const categories = useMemo(
    () => Array.from(new Set(restaurants.flatMap((r) => r.categories ?? []))).sort(),
    [restaurants]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return restaurants.filter((r) => {
      const cats = r.categories ?? [];
      if (category !== "all" && !cats.includes(category)) return false;
      const items = (r as { menu?: { veg?: boolean }[] }).menu ?? [];
      if (diet !== "all" && !items.some((m) => (diet === "veg" ? m.veg === true : m.veg === false))) return false;
      if (!q) return true;
      const haystack = [r.name, r.address ?? "", ...cats.map(labelFor)].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [restaurants, category, query, diet]);

  return (
    <>
      <TopBar
        onMenu={onMenu}
        cartCount={cartCount}
        onNotify={setToast}
        onOpenCart={() => setCartOpen(true)}
      />

      <div className={`shell ${collapsed ? "collapsed" : ""}`}>
        <Sidebar open={navOpen} collapsed={collapsed} onClose={() => setNavOpen(false)} />

        <main className="main container">
          <section id="top" className="hero">
            <div className="hero-grid">
              <div>
                <p className="kicker">Good Food • Better Mood</p>
                <h1>
                  <span>Great food,</span>
                  <span className="accent">delivered to you</span>
                </h1>
                <p className="lede">
                  Craving{" "}
                  <span key={wordIndex} className="swap">
                    {WORDS[wordIndex]}
                  </span>
                  ? Discover your favourite restaurants, order delicious food, and enjoy fast and reliable
                  delivery, all in one place.
                </p>
                <form
                  className="hsearch"
                  role="search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    document.getElementById("restaurants")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <label className="sr-only" htmlFor="restaurant-search">
                    Search restaurants
                  </label>
                  <input
                    id="restaurant-search"
                    type="search"
                    placeholder="Search for a restaurant or cuisine"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </form>
              </div>
              <HeroScene />
            </div>
          </section>

          <section id="restaurants" className="sec">
            <h2>Restaurants near you</h2>
            <p className="sub">Pick a cuisine to filter. Tap the heart to save a favourite.</p>

            <div className="diet" role="group" aria-label="Diet filter">
                  {([["all", "All"], ["veg", "Veg"], ["nonveg", "Non-veg"]] as const).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      className={diet === v ? "diet-btn on" : "diet-btn"}
                      aria-pressed={diet === v}
                      onClick={() => setDiet(v)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {categories.length > 0 && (
              <div className="cats" role="group" aria-label="Filter by cuisine">
                {["all", ...categories].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="cat"
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                  >
                    {c === "all" ? "All" : labelFor(c)}
                  </button>
                ))}
              </div>
            )}

            {loadStatus && (
              <p role="status" className="status">
                {loadStatus}
              </p>
            )}

            {!loadStatus && visible.length === 0 && (
              <div className="empty">No restaurants match your search. Try another cuisine or clear the search.</div>
            )}

            <div className="rgrid">
              {visible.map((r, i) => (
                <RestaurantCard
                  key={r._id}
                  restaurant={r}
                  tint={TINTS[i % TINTS.length]}
                  isFav={favourites.includes(r._id)}
                  onToggleFav={() => toggleFavourite(r)}
                  onOpenMenu={() => setMenuFor(r)}
                />
              ))}
            </div>
          </section>

          <Offers onNotify={setToast} />
          <LiveTracking />

          <section id="how" className="sec">
            <h2>How it works</h2>
            <p className="sub">Three steps from hungry to happy.</p>
            <div className="steps">
              <div className="step">
                <h3>Choose a restaurant</h3>
                <p>Search by name or pick a cuisine, then fill your cart.</p>
              </div>
              <div className="step">
                <h3>Pay and place</h3>
                <p>Apply a coupon and pay by UPI, card or cash on delivery.</p>
              </div>
              <div className="step">
                <h3>Track to your door</h3>
                <p>Follow your rider live and get notified when they arrive.</p>
              </div>
            </div>
          </section>
        </main>
      </div>

      <MenuSheet
        restaurant={menuFor}
        
        
        
        onClose={() => setMenuFor(null)} onToast={setToast}
      />

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

      <footer className="footer">
        <div className="container">&copy; 2026 BiteVerse. All rights reserved.</div>
      </footer>
    </>
  );
}

type CardProps = {
  restaurant: Restaurant;
  tint: string;
  isFav: boolean;
  onToggleFav: () => void;
  onOpenMenu: () => void;
};

function RestaurantCard({ restaurant: r, tint, isFav, onToggleFav, onOpenMenu }: CardProps) {
  const cuisines = (r.categories ?? []).map(labelFor).join(", ") || "Cuisine not set";
  const time =
    typeof r.deliveryMinutes?.min === "number" && typeof r.deliveryMinutes?.max === "number"
      ? `${r.deliveryMinutes.min}-${r.deliveryMinutes.max} min`
      : null;
  const cost = r.costForTwo ? `\u20B9${r.costForTwo} for two` : null;

  return (
    <article className="rc">
      <div className="art" style={{ background: tint }}>
        <span className="initial">{r.name.charAt(0).toUpperCase()}</span>
        <img
          className="photo"
          src={`/images/restaurants/${r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.jpg`}
          alt={r.name}
          loading="lazy"
          onError={(e) => { const el = e.currentTarget; if (el.src.endsWith(".jpg")) el.src = el.src.replace(/\.jpg$/, ".svg"); else el.style.display = "none"; }}
        />
        <button
          type="button"
          className="fav"
          aria-pressed={isFav}
          aria-label={`Favourite ${r.name}`}
          onClick={onToggleFav}
        >
          {isFav ? "\u2665" : "\u2661"}
        </button>
        {r.offerLabel && <span className="tag">{r.offerLabel}</span>}
      </div>
      <div className="body">
        <h3>{r.name}</h3>
        <span className="meta">{cuisines}</span>
        <div className="stats">
          {r.rating !== undefined && (
            <span>
              {"\u2605"} {Number(r.rating).toFixed(1)}
            </span>
          )}
          {time && <span>{time}</span>}
          {cost && <span>{cost}</span>}
        </div>
        {r.isOpen === false && <span className="closed">Closed now</span>}
        {r.address && <span className="meta">{r.address}</span>}
      </div>
      <button type="button" className="add" onClick={onOpenMenu}>
        Add to cart
      </button>
    </article>
  );
}
