"use client";
import { useEffect, useState } from "react";
import { getMe, type PublicUser } from "@/features/auth/auth.api";
import shared from "./admin-dashboard.module.css";
import styles from "./admin-profile.module.css";

export function AdminProfile() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getMe()
      .then((u) => {
        if (alive) setUser(u);
      })
      .catch((e) => {
        console.error("Profile load failed:", e);
        if (alive) setError("Could not load your profile.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <div className={shared.state}>Loading profile...</div>;
  if (error || !user) return <div className={shared.state}>{error || "Profile not found."}</div>;

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <section>
      <div className={shared.welcome}>
        <div>
          <h1 className={shared.title}>My profile</h1>
          <p className={shared.subtitle}>Manage your personal information and account settings.</p>
        </div>
      </div>

      <div className={shared.card}>
        <div className={styles.head}>
          <div className={styles.avatar}>{initial}</div>
          <div>
            <p className={styles.name}>{user.name}</p>
            <p className={shared.muted} style={{ margin: "0.15rem 0 0" }}>{user.email}</p>
            <div className={styles.tags}>
              <span className={`${shared.badge} ${shared.info}`}>
                {user.role === "admin" ? "Administrator" : user.role}
              </span>
              <span className={`${shared.badge} ${user.emailVerified ? shared.ok : shared.warn}`}>
                {user.emailVerified ? "Email verified" : "Email not verified"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={shared.card}>
          <div className={shared.cardHead}>
            <h2 className={shared.cardTitle}>Personal information</h2>
          </div>
          <dl className={styles.dl}>
            <dt>Full name</dt>
            <dd>{user.name}</dd>
            <dt>Email address</dt>
            <dd>{user.email}</dd>
            <dt>Phone number</dt>
            <dd>{user.phone || "Not added"}</dd>
            <dt>Role</dt>
            <dd>{user.role}</dd>
          </dl>
        </div>

        <div className={shared.card}>
          <div className={shared.cardHead}>
            <h2 className={shared.cardTitle}>Security</h2>
          </div>
          <p className={shared.muted}>
            To change your password, use the reset link on the forgot-password page.
          </p>
          <a href="/forgot-password" className={styles.link}>
            Reset password →
          </a>
        </div>
      </div>
    </section>
  );
}