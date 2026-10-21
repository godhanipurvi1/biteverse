"use client";

import { useEffect, useState } from "react";
import styles from "@/features/auth/auth.module.css";
import { getAdminStats, inr, type AdminStats } from "./admin.api";

export function AdminStatsCards() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      getAdminStats()
        .then((s) => alive && setStats(s))
        .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "Could not load stats"));
    load();
    const timer = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (error) return <p className={styles.error}>{error}</p>;
  if (!stats) return <p className={styles.muted}>Loading stats...</p>;

  const active = stats.total - (stats.byStatus["delivered"] ?? 0);
  const cards: [string, string][] = [
    ["Orders today", String(stats.today.orders)],
    ["Revenue today", inr(stats.today.revenueInr)],
    ["Active orders", String(active)],
    ["Delivered (all time)", String((stats.byStatus["delivered"] ?? 0))],
  ];

  return (
    <>
      <div className={styles.grid}>
        {cards.map(([label, value]) => (
          <div className={styles.card} key={label}>
            <p className={styles.muted}>{label}</p>
            <h2>{value}</h2>
          </div>
        ))}
      </div>
      <p className={styles.muted}>
        {Object.entries(stats.byStatus)
          .map(([s, n]) => `${s}: ${n}`)
          .join("  ·  ")}
      </p>
    </>
  );
}
