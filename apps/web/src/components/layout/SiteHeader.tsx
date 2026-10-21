"use client";

import Link from "next/link";
import styles from "@/features/auth/auth.module.css";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import { useSession } from "@/features/auth/use-session";

export function SiteHeader() {
  const { user, loading } = useSession();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand">
          Bite<span>Verse</span>
        </Link>
        <nav className="nav" aria-label="Account">
          {loading ? null : user ? (
            <>
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
