"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "@/features/auth/auth.module.css";
import {
  ORDER_STATUSES,
  getAdminOrders,
  inr,
  nextStatus,
  setOrderStatus,
  type AdminOrder,
} from "@/features/admin/admin.api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getAdminOrders(filter || undefined);
      setOrders(data.orders);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  async function advance(order: AdminOrder, next: string) {
    setBusyId(order._id);
    try {
      await setOrderStatus(order._id, next);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the order");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className={styles.pageWide}>
      <div className={styles.panelHeader}>
        <div>
          <h1>Orders</h1>
          <p className={styles.muted}>{orders.length} shown · refreshes every 10 seconds</p>
        </div>
        <Link href="/admin" className={styles.buttonOutline}>
          Back to admin
        </Link>
      </div>

      <label className={styles.field}>
        Filter by status
        <select className={styles.input} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All orders</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {error && <p className={styles.error}>{error}</p>}
      {loading && <p className={styles.muted}>Loading orders...</p>}
      {!loading && orders.length === 0 && <p className={styles.muted}>No orders found.</p>}

      {orders.map((o) => {
        const next = nextStatus(o.status, o.mode);
        return (
          <div className={styles.card} key={o._id} style={{ marginBottom: "1rem" }}>
            <div className={styles.panelHeader}>
              <div>
                <h3>
                  #{o._id.substring(0, 8)} · {o.restaurantSlug}
                </h3>
                <p className={styles.muted}>
                  {o.userId ? `${o.userId.name} · ${o.userId.phone}` : "Unknown customer"} ·{" "}
                  {new Date(o.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`${styles.badge} ${o.status === "delivered" ? styles.badgeOk : styles.badgeWarn}`}>
                {o.status}
              </span>
            </div>
            <p>
              {o.items.map((i) => `${i.menuItemName} × ${i.quantity}`).join(", ")}
            </p>
            <p>
              <strong>{inr(o.totalInr)}</strong> · {o.mode}
              {o.address ? ` · ${o.address}` : ""}
            </p>
            {next ? (
              <button
                className={styles.buttonSmall}
                disabled={busyId === o._id}
                onClick={() => advance(o, next)}
              >
                {busyId === o._id ? "Updating..." : `Mark as ${next}`}
              </button>
            ) : (
              <span className={`${styles.badge} ${styles.badgeOk}`}>Completed</span>
            )}
          </div>
        );
      })}
    </section>
  );
}
