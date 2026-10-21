"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./topbar.module.css";

const PATHS = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  store: "M4 9l1.5-5h13L20 9M4 9h16v2a3 3 0 0 1-6 0 3 3 0 0 1-4 0 3 3 0 0 1-6 0V9zM5 13v7h14v-7",
  tag: "M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5 5-2z",
  cart: "M3 4h2l2.4 11h10.2L20 7H6.2M9 20h.01M17 20h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6",
  logout: "M10 4H5v16h5M15 8l4 4-4 4M19 12H9",
};

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const NAV = [
  { href: "/", label: "Home", icon: PATHS.home, exact: true },
  { href: "/restaurants", label: "Restaurants", icon: PATHS.store },
  { href: "/offers", label: "Offers", icon: PATHS.tag },
  { href: "/explore", label: "Explore", icon: PATHS.compass },
];

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className={styles.bar}>
      <div className={styles.row}>
        <Link href="/" className={styles.logo} aria-label="BiteVerse home">
          Bite<b>Verse</b>
        </Link>

        <nav className={styles.nav} aria-label="Main">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={active ? `${styles.navLink} ${styles.active}` : styles.navLink}
              >
                <Icon d={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.right}>
          <Link href="/cart" className={styles.iconBtn} aria-label="Cart">
            <Icon d={PATHS.cart} />
          </Link>
          <Link href="/account" className={styles.account}>
            <span className={styles.avatar}>
              <Icon d={PATHS.user} />
            </span>
            <span className={styles.accountName}>Account</span>
          </Link>
          <Link href="/login" className={styles.logout}>
            <Icon d={PATHS.logout} />
            <span>Log out</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
