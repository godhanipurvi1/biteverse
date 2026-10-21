import { getServerUser } from "@/features/auth/server-session";
import styles from "@/features/auth/auth.module.css";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";

const sections = ["Orders", "Menu", "Riders", "Offers", "Reviews", "Reports"];

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

      <div className={styles.grid}>
        {sections.map((name) => (
          <div className={styles.card} key={name}>
            <span className={`${styles.badge} ${styles.badgeWarn}`}>Coming soon</span>
            <h2>{name}</h2>
          </div>
        ))}
      </div>
    </section>
  );
}
