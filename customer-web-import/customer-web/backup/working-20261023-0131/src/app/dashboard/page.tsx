"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  API_URL,
  AuthError,
  fetchMyOrders,
  formatWhen,
  isCancelled,
  isFinal,
  money,
  normaliseStatus,
  shortId,
  STEP_LABELS,
  STEPS,
  TOKEN_KEY,
  type Order,
} from "../../lib/orders";
import { fetchFavorites, setFavorite, type FavoriteRestaurant } from "../../lib/favorites";
import styles from "./dashboard.module.css";

const PATHS = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  store: "M4 9l1.5-5h13L20 9M4 9h16v2a3 3 0 0 1-6 0 3 3 0 0 1-4 0 3 3 0 0 1-6 0V9zM5 13v7h14v-7",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6",
  heart: "M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10z",
  cart: "M3 4h2l2.4 11h10.2L20 7H6.2M9 20h.01M17 20h.01",
  bike: "M5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 15l3-6h4l4 6M11 9L9.5 6H7",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z",
  menu: "M4 7h16M4 12h16M4 17h16",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3",
};

type IconName = keyof typeof PATHS;
type NavKey = "dashboard" | "restaurants" | "orders" | "favorites" | "cart";

const NAV: { key: NavKey; href: string; label: string; icon: IconName }[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: "grid" },
  { key: "restaurants", href: "/#restaurants", label: "Restaurants", icon: "store" },
  { key: "orders", href: "/orders", label: "My orders", icon: "receipt" },
  { key: "favorites", href: "/favorites", label: "Favourites", icon: "heart" },
  { key: "cart", href: "/cart", label: "Cart", icon: "cart" },
];

const STAGES = ["Placed", "Confirmed", "Preparing", "Ready", "On the way", "Delivered"];
const TINTS = ["var(--tintA)", "var(--tintB)", "var(--tintC)", "var(--tintD)"];

function Icon({ name, fill = false }: { name: IconName; fill?: boolean }) {
  return (
    <svg
      className={styles.ic}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

async function fetchName(): Promise<string> {
  const token = window.localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (res.status === 401) throw new AuthError("Log in to see your dashboard.");
  if (!res.ok) return "";
  const json = await res.json().catch(() => ({}));
  const u = json.user ?? json.data ?? json;
  const raw: string = (u.firstName ?? u.name ?? "").split(" ")[0];
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function cuisineOf(r: FavoriteRestaurant): string {
  if (typeof r.cuisine === "string") return r.cuisine;
  const cats = r.categories;
  return Array.isArray(cats) ? cats.filter((c) => typeof c === "string").join(", ") : "";
}

function Frame({
  current,
  name,
  favorites,
  onRemove,
  activeOrderId,
  children,
}: {
  current: NavKey;
  name: string;
  favorites: FavoriteRestaurant[];
  onRemove: (id: string) => void;
  activeOrderId?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const initial = name.charAt(0) || "B";

  return (
    <div className={styles.page}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
      />

      <header className={styles.topbar}>
        <div className={styles.topRow}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Toggle sidebar"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name="menu" />
          </button>
          <Link href="/" className={styles.logo}>
            Bite<b>Verse</b>
          </Link>
          <Link href="/#restaurants" className={styles.search}>
            <Icon name="search" />
            <span>Search restaurants or dishes</span>
          </Link>
          <span className={styles.spacer} />
          <Link href="/cart" className={styles.iconBtn} aria-label="Cart">
            <Icon name="cart" />
          </Link>
          <span className={styles.userPill}>
            <span className={styles.avatar}>{initial}</span>
            <span className={styles.userName}>{name || "Account"}</span>
          </span>
        </div>
      </header>

      <div className={`${styles.shell} ${open ? styles.shellOpen : ""}`}>
        {open && (
          <button type="button" className={styles.scrim} aria-label="Close sidebar" onClick={() => setOpen(false)} />
        )}

        <aside className={styles.side} aria-label="Menu">
          <p className={styles.menuLabel}>Menu</p>
          <nav className={styles.nav}>
            {NAV.map((n) => (
              <Link
                key={n.key}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`${styles.navLink} ${n.key === current ? styles.navOn : ""}`}
              >
                <Icon name={n.icon} />
                {n.label}
              </Link>
            ))}
          </nav>

          {favorites.length > 0 && (
            <div className={styles.sideFavs}>
              <p className={styles.menuLabel}>Saved</p>
              {favorites.map((r) => (
                <div key={r._id} className={styles.sideFav}>
                  <span className={styles.sideDot}>{r.name.charAt(0).toUpperCase()}</span>
                  <span className={styles.sideName}>{r.name}</span>
                  <button
                    type="button"
                    className={styles.sideRemove}
                    aria-label={`Remove ${r.name} from favourites`}
                    title="Remove from favourites"
                    onClick={() => onRemove(String(r._id))}
                  >
                    <Icon name="heart" fill />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.promo}>
            <p>
              {activeOrderId
                ? "Your order is on its way. Track it live."
                : "Hungry right now? Find something to order."}
            </p>
            <Link
              href={activeOrderId ? `/orders/${activeOrderId}` : "/#restaurants"}
              className={styles.promoBtn}
              onClick={() => setOpen(false)}
            >
              {activeOrderId ? "Track order" : "Browse restaurants"}
            </Link>
          </div>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function Route({ status }: { status: string }) {
  const idx = STEPS.indexOf(status);
  const last = STEPS.length - 1;
  const pct = idx < 0 ? 0 : (idx / last) * 100;
  return (
    <>
      <div className={styles.route}>
        <div className={styles.rail} />
        <div className={styles.fill} style={{ width: `${pct}%` }} />
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`${styles.stop} ${i <= idx ? styles.stopDone : ""}`}
            style={{ left: `${(i / last) * 100}%` }}
          />
        ))}
        <span className={styles.rider} style={{ left: `${pct}%` }}>
          <Icon name="bike" />
        </span>
      </div>
      <div className={styles.labels}>
        {STAGES.map((label, i) => (
          <span key={label} className={i <= idx ? styles.labelOn : ""}>
            {label}
          </span>
        ))}
      </div>
    </>
  );
}

export default function DashboardPage() {
  const [name, setName] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [favorites, setFavorites] = useState<FavoriteRestaurant[] | null>(null);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchName(), fetchMyOrders(), fetchFavorites()])
      .then(([n, o, f]) => {
        if (cancelled) return;
        setName(n);
        setOrders(o);
        setFavorites(f);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        if (err instanceof AuthError) setNeedsLogin(true);
        else setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Removes a saved restaurant in place, without leaving the page.
  const removeFavourite = (id: string) => {
    setFavorites((prev) => (prev ? prev.filter((r) => String(r._id) !== id) : prev));
    setFavorite(id, false).catch(() => {
      fetchFavorites()
        .then(setFavorites)
        .catch(() => {});
    });
  };

  if (needsLogin) {
    return (
      <Frame current="dashboard" name="" favorites={[]} onRemove={removeFavourite}>
        <div className={styles.empty}>
          Log in to see your dashboard. <Link href="/login">Log in</Link>
        </div>
      </Frame>
    );
  }

  if (!orders || !favorites) {
    return (
      <Frame current="dashboard" name={name} favorites={favorites ?? []} onRemove={removeFavourite}>
        {error ? <p className={styles.error}>{error}</p> : <p className={styles.muted}>Loading your dashboard...</p>}
      </Frame>
    );
  }

  const active = orders.find((o) => !isFinal(normaliseStatus(o.status)));
  const activeCount = orders.filter((o) => !isFinal(normaliseStatus(o.status))).length;
  const spent = orders
    .filter((o) => !isCancelled(normaliseStatus(o.status)))
    .reduce((n, o) => n + (o.total ?? 0), 0);
  const activeStatus = active ? normaliseStatus(active.status) : "";

  return (
    <Frame
      current="dashboard"
      name={name}
      favorites={favorites}
      onRemove={removeFavourite}
      activeOrderId={active ? String(active._id) : undefined}
    >
      <p className={styles.kicker}>
        <Icon name="bike" />
        {active ? "Order in progress" : "Nothing on the way"}
      </p>
      <h1>Hi {name || "there"}</h1>
      <p className={styles.lede}>Your orders, favourites and spending in one place.</p>

      <div className={styles.stats}>
        <Stat label="Orders" value={orders.length} />
        <Stat label="Active now" value={activeCount} />
        <Stat label="Favourites" value={favorites.length} />
        <Stat label="Spent" value={money(spent)} />
      </div>

      {active && (
        <section className={styles.track}>
          <div>
            <p className={styles.trackSub}>
              {active.restaurantName ?? "Your order"} · #{shortId(active._id)}
            </p>
            <h2 className={styles.trackTitle}>{STEP_LABELS[activeStatus] ?? activeStatus}</h2>
            <Link href={`/orders/${active._id}`} className={styles.cta}>
              Track order
            </Link>
          </div>
          <div>
            <Route status={activeStatus} />
          </div>
        </section>
      )}

      <div className={styles.columns}>
        <section>
          <div className={styles.sectionHead}>
            <h2>Recent orders</h2>
            <Link href="/orders" className={styles.textLink}>
              All orders
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className={styles.empty}>
              No orders yet. <Link href="/#restaurants">Browse restaurants</Link>
            </div>
          ) : (
            <ul className={styles.rows}>
              {orders.slice(0, 4).map((o) => {
                const s = normaliseStatus(o.status);
                return (
                  <li key={o._id}>
                    <Link href={`/orders/${o._id}`} className={styles.row}>
                      <span>
                        <strong>{o.restaurantName ?? "Restaurant"}</strong>
                        <span className={styles.meta}>
                          {formatWhen(o.createdAt)} · #{shortId(o._id)}
                        </span>
                      </span>
                      <span className={styles.rowRight}>
                        <span className={styles.pill}>{STEP_LABELS[s] ?? s}</span>
                        <strong>{money(o.total ?? 0)}</strong>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <div className={styles.sectionHead}>
            <h2>Favourites</h2>
          </div>
          {favorites.length === 0 ? (
            <div className={styles.empty}>No favourites yet. Tap the heart on a restaurant to save it.</div>
          ) : (
            <div className={styles.cards}>
              {favorites.map((r, i) => (
                <article key={r._id} className={styles.card}>
                  <div className={styles.art} style={{ background: TINTS[i % TINTS.length] }}>
                    <span className={styles.initial}>{r.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <h3>{r.name}</h3>
                    <span className={styles.meta}>{cuisineOf(r) || "Cuisine not set"}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => removeFavourite(String(r._id))}
                  >
                    <Icon name="heart" fill /> Remove
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Frame>
  );
}