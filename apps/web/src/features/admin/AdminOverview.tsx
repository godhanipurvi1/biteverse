"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "@/features/auth/auth.module.css";
import { getAdminOffers, getAdminOrders, inr, type AdminOffer, type AdminOrder } from "./admin.api";

const offerText = (o: AdminOffer) =>
  o.type === "percent" ? `${o.value}% off` : `${inr(o.value)} off`;

export function AdminOverview() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [offers, setOffers] = useState<AdminOffer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [o, f] = await Promise.all([getAdminOrders(), getAdminOffers()]);
        if (!alive) return;
        setOrders(o.orders.slice(0, 5));
        setOffers(f.offers);
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Could not load the overview");
      }
    };
    load();
    const timer = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.panelHeader}>
          <h2>Recent orders</h2>
          <Link href="/admin/orders" className={styles.buttonOutline}>View all</Link>
        </div>
        {!orders && <p className={styles.muted}>Loading...</p>}
        {orders && orders.length === 0 && <p className={styles.muted}>No orders yet.</p>}
        {orders?.map((o) => (
          <div
            key={o._id}
            style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", padding: "0.5rem 0", borderBottom: "1px solid var(--line)" }}
          >
            <span>
              #{o._id.substring(0, 8)} · {o.userId?.name ?? "Unknown"}
              <br />
              <small className={styles.muted}>{inr(o.totalInr)} · {o.mode}</small>
            </span>
            <span className={`${styles.badge} ${o.status === "delivered" ? styles.badgeOk : styles.badgeWarn}`}>
              {o.status}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.panelHeader}>
          <h2>Offers</h2>
          <Link href="/admin/offers" className={styles.buttonOutline}>Manage</Link>
        </div>
        {!offers && <p className={styles.muted}>Loading...</p>}
        {offers && offers.length === 0 && <p className={styles.muted}>No coupons yet.</p>}
        {offers?.map((o) => (
          <div
            key={o._id}
            style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", padding: "0.5rem 0", borderBottom: "1px solid var(--line)" }}
          >
            <span>
              {o.code}
              <br />
              <small className={styles.muted}>{o.title} · {offerText(o)}</small>
            </span>
            <span className={`${styles.badge} ${o.active ? styles.badgeOk : styles.badgeWarn}`}>
              {o.active ? "Active" : "Off"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
