"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import Icon from "./Icon";
import styles from "./Sidebar.nav.module.css";

type Props = {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  /** Number shown on the Cart row. Hidden when 0 or undefined. */
  cartCount?: number;
  /** Number shown on the Offers row. */
  offersCount?: number;
};

type Item = {
  label: string;
  href: string;
  icon: ReactNode;
  /** Real pages that light this row up. Rows without it are home page anchors. */
  match?: string[];
  badge?: "cart" | "offers";
};

function Ico({ children }: { children: ReactNode }) {
  return (
    <svg
      className={styles.icon}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// Change the hrefs here. Menu and Help have no page yet, so they only point at an empty anchor.
const ITEMS: Item[] = [
  {
    label: "Home",
    href: "/#top",
    icon: (
      <Ico>
        <path d="M3 11 12 3l9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-5h4v5" />
      </Ico>
    ),
  },
  {
    label: "Restaurants",
    href: "/#restaurants",
    icon: (
      <Ico>
        <path d="M4 9V5h16v4" />
        <path d="M4 9a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0A2.67 2.67 0 0 0 20 9" />
        <path d="M5 12v8h14v-8" />
      </Ico>
    ),
  },
  {
    label: "Menu",
    href: "/menu",
    match: ["/menu"],
    icon: (
      <Ico>
        <path d="M5 3v6a2 2 0 0 0 4 0V3" />
        <path d="M7 11v10" />
        <path d="M16 21V3c-2 1.5-3 4-3 7 0 2 1 3 3 3" />
      </Ico>
    ),
  },
  {
    label: "Cart",
    href: "/cart",
    badge: "cart",
    match: ["/cart", "/checkout"],
    icon: (
      <Ico>
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 7H6" />
      </Ico>
    ),
  },
  {
    label: "Favourites",
    href: "/favourites",
    match: ["/favourites", "/favorites"],
    icon: (
      <Ico>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </Ico>
    ),
  },
  {
    label: "My orders",
    href: "/orders",
    icon: (
      <Ico>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6" />
      </Ico>
    ),
  },
  {
    label: "Offers",
    href: "/#offers",
    badge: "offers",
    icon: (
      <Ico>
        <path d="M3 4h8l10 10-8 8L3 12z" />
        <circle cx="7.5" cy="8.5" r="1.2" />
      </Ico>
    ),
  },
  {
    label: "Help",
    href: "/help",
    icon: (
      <Ico>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8" />
        <path d="M12 17h.01" />
      </Ico>
    ),
  },
];export default function Sidebar({ open, collapsed, onClose, cartCount, offersCount = 3 }: Props) {
  const pathname = usePathname() ?? "/";
  const [hash, setHash] = useState("/#top");

  const isOn = (item: Item) =>
    item.match
      ? item.match.some((p) => pathname === p || pathname.startsWith(p + "/"))
      : pathname === "/" && hash === item.href;

  return (
    <>
      <div className={`scrim ${open ? "show" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside
        className={`side ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}
        aria-label="Main menu"
      >
        <div className="side-head">
          <span className="side-title">Menu</span>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>
        <nav>
          {ITEMS.map((item) => {
            const on = isOn(item);
            const badge =
              item.badge === "cart"
                ? cartCount
                : item.badge === "offers"
                  ? offersCount
                  : undefined;
            return (
              <Link
                key={item.label}
                href={item.href}
                title={item.label}
                className={on ? "on" : ""}
                aria-current={on ? "page" : undefined}
                onClick={() => {
                  if (!item.match) setHash(item.href);
                  onClose();
                }}
              >
                {item.icon}
                <span className="lbl">{item.label}</span>
                {badge ? <span className={styles.badge}>{badge}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="promo">
          <p>Hungry right now? Your last order can be tracked live.</p>
          <a href="/track-order">Track order</a>
          <span className="ring" aria-hidden="true" />
        </div>
      </aside>
    </>
  );
}