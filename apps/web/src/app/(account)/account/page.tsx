import Link from "next/link";
import { getServerUser } from "@/features/auth/server-session";
import styles from "@/features/auth/auth.module.css";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import { OrdersPanel } from "@/features/account/components/OrdersPanel";

export default async function AccountPage() {
  const user = await getServerUser();
  if (!user) return null;

  return (
    <section className={styles.pageWide}>
      <div className={styles.panelHeader}>
        <h1>Hi, {user.name}</h1>
        <LogoutButton className={styles.buttonOutline} />
      </div>

      {!user.emailVerified && (
        <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
          <p>
            Your email isn&apos;t verified yet.{" "}
            <Link href="/verify-email">Verify it now</Link>.
          </p>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Profile</h2>
          <dl>
            <dt>Name</dt>
            <dd>{user.name}</dd>
            <dt>Email</dt>
            <dd>
              {user.email}{" "}
              <span className={`${styles.badge} ${user.emailVerified ? styles.badgeOk : styles.badgeWarn}`}>
                {user.emailVerified ? "Verified" : "Not verified"}
              </span>
            </dd>
            <dt>Phone</dt>
            <dd>{user.phone}</dd>
            <dt>Role</dt>
            <dd>{user.role}</dd>
          </dl>
        </div>

        <div className={styles.card}>
          <h2>Orders</h2>
          <OrdersPanel />
        </div>
      </div>
    </section>
  );
}
