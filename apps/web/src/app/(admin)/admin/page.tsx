import Link from "next/link";
import { getServerUser } from "@/features/auth/server-session";
import styles from "@/features/auth/auth.module.css";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import { AdminStatsCards } from "@/features/admin/AdminStats";

const comingSoon = ["Menu", "Riders", "Offers", "Reviews", "Reports"];

export default async function AdminPage() {
  const user = await getServerUser();
  if (!user) return null;

  return (
    <section className={styles.pageWide}>
      <div className={styles.panelHeader}>
        <div>
          <h1>Admin</h1>
          <p className={styles.muted}>Signed in as {user.name}</p>
        </div>
        <LogoutButton className={styles.buttonOutline} />
      </div>

      <AdminStatsCards />

      <div className={styles.grid}>
        <Link href="/admin/orders" className={styles.card}>
          <span className={`${styles.badge} ${styles.badgeOk}`}>Live</span>
          <h2>Orders</h2>
          <p className={styles.muted}>View and update every order</p>
        </Link>
        {comingSoon.map((name) => (
          <div className={styles.card} key={name}>
            <span className={`${styles.badge} ${styles.badgeWarn}`}>Coming soon</span>
            <h2>{name}</h2>
          </div>
        ))}
      </div>
    </section>
  );
}
