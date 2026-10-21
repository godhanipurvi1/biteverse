"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/features/auth/use-session";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import styles from "./home.module.css";

const links = [
  { href: "/", label: "Home" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/offers", label: "Offers" },
  { href: "/explore", label: "Explore" },
];

type Props = { cartCount?: number };

export function SiteHeader({ cartCount = 0 }: Props) {
  const { user } = useSession();
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo}>
          Bite<span>Verse</span>
        </Link>

        <nav className={styles.nav}>
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.right}>
          <Link href="/cart" className={styles.cart} aria-label="Cart">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="18" cy="20" r="1.5" />
              <path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6" />
            </svg>
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </Link>

          {user ? (
            <>
              <div className={styles.user}>
                <span className={styles.avatar}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                  </svg>
                </span>
                <span>{user.name}</span>
              </div>
              <span className={styles.divider} />
              <LogoutButton className={styles.logout} />
            </>
          ) : (
            <Link href="/login" className={styles.logout}>Log in</Link>
          )}
        </div>
      </div>
    </header>
  );
}