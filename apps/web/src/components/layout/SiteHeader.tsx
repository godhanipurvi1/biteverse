"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "@/features/auth/auth.module.css";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import { useSession } from "@/features/auth/use-session";
import { getCart } from "@/features/orders/orders.api";

export function SiteHeader() {
  const { user, loading } = useSession();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (user) {
      getCart().then((cart) => setCartCount(cart.items.length)).catch(() => setCartCount(0));
    }
  }, [user]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand">
          Bite<span>Verse</span>
        </Link>
        <nav className="nav" aria-label="Account">
          {loading ? null : user ? (
            <>
              <Link href="/cart" style={{ position: "relative" }} className="nav__link">
                🛒 Cart
                {cartCount > 0 && (
                  <span className={styles.badge} style={{ position: "absolute", top: "-5px", right: "-10px" }}>
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link href={user.role === "admin" ? "/admin" : "/account"} className="nav__link">
                {user.name}
              </Link>
              <LogoutButton className={styles.linkButton} />
            </>
          ) : (
            <>
              <Link href="/login" className="nav__link">
                Log in
              </Link>
              <Link href="/signup" className={styles.buttonSmall}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
