"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import styles from "./admin-shell.module.css";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "⌂" },
  { href: "/admin/orders", label: "Orders", icon: "☰" },
  { href: "/admin/offers", label: "Offers & Coupons", icon: "%" },
  { href: "/admin/menu", label: "Menu", icon: "≡" },
  { href: "/admin/profile", label: "My Profile", icon: "◉" },
];

type Props = { name: string; role: string; children: ReactNode };

export function AdminShell({ name, role, children }: Props) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand}>
          Bite<span>Verse</span>
        </Link>
        <p className={styles.panelLabel}>Admin panel</p>
        <nav className={styles.nav}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.navActive : ""}`}
            >
              <span className={styles.navIcon} aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.sideFoot}>
          <LogoutButton className={styles.logout} />
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <input className={styles.search} type="search" placeholder="Search anything..." />
          <div className={styles.userBox}>
            <span className={styles.bell} aria-hidden>
              🔔
            </span>
            <span className={styles.avatar}>{name.charAt(0).toUpperCase()}</span>
            <div>
              <p className={styles.userName}>{name}</p>
              <p className={styles.userRole}>{role === "admin" ? "Administrator" : role}</p>
            </div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}