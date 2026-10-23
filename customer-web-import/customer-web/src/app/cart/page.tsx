"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { API_URL, TOKEN_KEY } from "../../lib/orders";
import {
  useCart,
  changeQty,
  removeLine,
  groupByRestaurant,
  cartCountOf,
  cartSubtotalOf,
  cartDeliveryFeeOf,
} from "../../lib/cart";
import shell from "../dashboard/dashboard.module.css";
import styles from "./cart.module.css";

const RUPEE = "\u20B9";
const money = (n: number) => `${RUPEE}${Math.round(n)}`;

const PATHS = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  store: "M4 9l1.5-5h13L20 9M4 9h16v2a3 3 0 0 1-6 0 3 3 0 0 1-4 0 3 3 0 0 1-6 0V9zM5 13v7h14v-7",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6",
  heart: "M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10z",
  cart: "M3 4h2l2.4 11h10.2L20 7H6.2M9 20h.01M17 20h.01",
  menu: "M4 7h16M4 12h16M4 17h16",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3",
};
type IconName = keyof typeof PATHS;

const NAV: { key: string; href: string; label: string; icon: IconName }[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: "grid" },
  { key: "restaurants", href: "/#restaurants", label: "Restaurants", icon: "store" },
  { key: "orders", href: "/orders", label: "My orders", icon: "receipt" },
  { key: "favorites", href: "/favourites", label: "Favourites", icon: "heart" },
  { key: "cart", href: "/cart", label: "Cart", icon: "cart" },
];

function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className ?? shell.ic}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
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
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) return "";
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return "";
    const json = await res.json().catch(() => ({}));
    const u = json.user ?? json.data ?? json;
    const raw: string = (u.firstName ?? u.name ?? "").split(" ")[0];
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  } catch {
    return "";
  }
}

function Frame({ name, count, children }: { name: string; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const initial = name.charAt(0) || "B";

  return (
    <div className={shell.page}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
      />

      <header className={shell.topbar}>
        <div className={shell.topRow}>
          <button
            type="button"
            className={shell.iconBtn}
            aria-label="Toggle sidebar"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name="menu" />
          </button>
          <Link href="/" className={shell.logo}>
            Bite<b>Verse</b>
          </Link>
          <Link href="/#restaurants" className={shell.search}>
            <Icon name="search" />
            <span>Search restaurants or dishes</span>
          </Link>
          <span className={shell.spacer} />
          <Link href="/cart" className={shell.iconBtn} aria-label={`Cart, ${count} items`}>
            <Icon name="cart" />
          </Link>
          <span className={shell.userPill}>
            <span className={shell.avatar}>{initial}</span>
            <span className={shell.userName}>{name || "Account"}</span>
          </span>
        </div>
      </header>

      <div className={`${shell.shell} ${open ? shell.shellOpen : ""}`}>
        {open && (
          <button type="button" className={shell.scrim} aria-label="Close sidebar" onClick={() => setOpen(false)} />
        )}

        <aside className={shell.side} aria-label="Menu">
          <p className={shell.menuLabel}>Menu</p>
          <nav className={shell.nav}>
            {NAV.map((n) => (
              <Link
                key={n.key}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`${shell.navLink} ${n.key === "cart" ? shell.navOn : ""}`}
              >
                <Icon name={n.icon} />
                {n.label}
              </Link>
            ))}
          </nav>

          <div className={shell.promo}>
            <p>Hungry right now? Find something to order.</p>
            <Link href="/#restaurants" className={shell.promoBtn} onClick={() => setOpen(false)}>
              Browse restaurants
            </Link>
          </div>
        </aside>

        <main className={shell.main}>{children}</main>
      </div>
    </div>
  );
}

export default function CartPage() {
  const cart = useCart();
  const [name, setName] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchName().then((n) => {
      if (!cancelled) setName(n);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const lines = cart?.lines ?? [];
  const count = cartCountOf(cart);

  if (lines.length === 0) {
    return (
      <Frame name={name} count={0}>
        <h1 className={styles.title}>Your cart</h1>
        <div className={`${styles.panel} ${styles.empty}`}>
          <span className={styles.emptyIcon}>
            <Icon name="cart" className="" />
          </span>
          <h2>Your cart is empty</h2>
          <p>Pick a restaurant and add a few dishes. They will show up here.</p>
          <Link href="/#restaurants" className={styles.checkout}>
            Browse restaurants
          </Link>
        </div>
      </Frame>
    );
  }

  const groups = groupByRestaurant(cart);
  const subtotal = cartSubtotalOf(cart);
  const delivery = cartDeliveryFeeOf(cart);

  return (
    <Frame name={name} count={count}>
      <h1 className={styles.title}>Your cart</h1>

      <div className={styles.layout}>
        <div className={styles.panel}>
          {groups.map((g) => (
            <section key={g.restaurantId} className={styles.group}>
              <div className={styles.groupHead}>
                <h2 className={styles.restaurant}>{g.restaurantName}</h2>
                <span className={styles.fee}>Delivery {money(g.fee)}</span>
              </div>
              <ul className={styles.lines}>
                {g.lines.map((l) => (
                  <li key={l.id} className={styles.line}>
                    <span className={styles.name}>
                      {l.name}
                      <span className={styles.unit}>{money(l.price)} each</span>
                    </span>
                    <span className={styles.stepper}>
                      <button type="button" onClick={() => changeQty(l.id, -1)} aria-label={`Decrease ${l.name}`}>
                        -
                      </button>
                      <span aria-live="polite">{l.qty}</span>
                      <button type="button" onClick={() => changeQty(l.id, 1)} aria-label={`Increase ${l.name}`}>
                        +
                      </button>
                    </span>
                    <span className={styles.price}>{money(l.price * l.qty)}</span>
                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() => removeLine(l.id)}
                      aria-label={`Remove ${l.name}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className={`${styles.panel} ${styles.summary}`} aria-label="Order summary">
          <h2>Order summary</h2>
          <div className={styles.sumRow}>
            <span>Items ({count})</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className={styles.sumRow}>
            <span>Delivery</span>
            <span>{money(delivery)}</span>
          </div>
          <div className={styles.sumTotal}>
            <span>Total</span>
            <span>{money(subtotal + delivery)}</span>
          </div>
          <Link href="/checkout" className={styles.checkout}>
            Checkout
          </Link>
          <Link href="/#restaurants" className={styles.more}>
            Add more dishes
          </Link>
        </aside>
      </div>
    </Frame>
  );
}
