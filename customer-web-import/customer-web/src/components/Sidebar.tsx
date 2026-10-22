"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./Sidebar.nav.module.css";

type Props = {
  /** Number shown on the Cart row. Hidden when 0 or undefined. */
  cartCount?: number;
  /** Number shown on the Offers row. */
  offersCount?: number;
  /** If given, the Cart row opens your cart drawer instead of linking to /cart. */
  onOpenCart?: () => void;
  /** Extra props that older pages pass are accepted and ignored, so nothing breaks. */
  [key: string]: unknown;
};

type Item = {
  label: string;
  href: string;
  icon: ReactNode;
  /** Paths that should light this row up. Defaults to [href]. */
  match?: string[];
  badge?: "cart" | "offers";
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className={styles.icon}
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

// Edit the hrefs here if your routes are named differently.
const ITEMS: Item[] = [
  {
    label: "Home",
    href: "/",
    icon: (
      <Icon>
        <path d="M3 11 12 3l9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-5h4v5" />
      </Icon>
    ),
  },
  {
    label: "Restaurants",
    href: "/restaurants",
    icon: (
      <Icon>
        <path d="M4 9V5h16v4" />
        <path d="M4 9a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0A2.67 2.67 0 0 0 20 9" />
        <path d="M5 12v8h14v-8" />
      </Icon>
    ),
  },
  {
    label: "Menu",
    href: "/menu",
    icon: (
      <Icon>
        <path d="M5 3v6a2 2 0 0 0 4 0V3" />
        <path d="M7 11v10" />
        <path d="M16 21V3c-2 1.5-3 4-3 7 0 2 1 3 3 3" />
      </Icon>
    ),
  },
  {
    label: "Cart",
    href: "/cart",
    badge: "cart",
    match: ["/cart", "/checkout"],
    icon: (
      <Icon>
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 7H6" />
      </Icon>
    ),
  },
  {
    label: "Favourites",
    href: "/favourites",
    match: ["/favourites", "/favorites"],
    icon: (
      <Icon>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </Icon>
    ),
  },
  {
    label: "My orders",
    href: "/orders",
    icon: (
      <Icon>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6" />
      </Icon>
    ),
  },
  {
    label: "Offers",
    href: "/offers",
    badge: "offers",
    icon: (
      <Icon>
        <path d="M3 4h8l10 10-8 8L3 12z" />
        <circle cx="7.5" cy="8.5" r="1.2" />
      </Icon>
    ),
  },
  {
    label: "Help",
    href: "/help",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8" />
        <path d="M12 17h.01" />
      </Icon>
    ),
  },
];

export default function Sidebar({ cartCount, offersCount = 3, onOpenCart }: Props) {
  const pathname = usePathname() ?? "/";

  const isActive = (item: Item) =>
    (item.match ?? [item.href]).some((p) =>
      p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")
    );

  return (
    <aside className={styles.root} aria-label="Main menu">
      <p className={styles.heading}>Menu</p>

      <nav>
        <ul className={styles.list}>
          {ITEMS.map((item) => {
            const active = isActive(item);
            const badge =
              item.badge === "cart"
                ? cartCount
                : item.badge === "offers"
                  ? offersCount
                  : undefined;
            const className = `${styles.item} ${active ? styles.active : ""}`;
            const content = (
              <>
                {item.icon}
                <span className={styles.label}>{item.label}</span>
                {badge ? <span className={styles.badge}>{badge}</span> : null}
              </>
            );

            return (
              <li key={item.label}>
                {item.badge === "cart" && onOpenCart ? (
                  <button type="button" className={className} onClick={onOpenCart}>
                    {content}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={className}
                    aria-current={active ? "page" : undefined}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.promo}>
        <p className={styles.promoText}>
          Hungry right now? Your last order can be tracked live.
        </p>
        <Link href="/orders" className={styles.promoBtn}>
          Track order
        </Link>
        <span className={styles.promoCircle} aria-hidden="true" />
      </div>
    </aside>
  );
}