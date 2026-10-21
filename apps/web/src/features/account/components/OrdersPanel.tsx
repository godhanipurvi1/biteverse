"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "@/features/auth/auth.module.css";
import { api } from "@/lib/api/client";

type Order = {
  _id: string;
  status: string;
  totalInr: number; // stored in paise
  mode: string;
  createdAt: string;
  restaurantName?: string;
};

const formatPrice = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

export function OrdersPanel() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api<Order[]>("/orders")
      .then((data) => {
        if (alive) setOrders(data);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        if (alive) setError("Could not load your orders");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <p className={styles.error}>{error}</p>;
  if (!orders) return <p className={styles.muted}>Loading orders...</p>;
  if (orders.length === 0)
    return <p className={styles.muted}>You haven&apos;t placed any orders yet.</p>;

  return (
    <div>
      {orders.map((o) => (
        <Link
          key={o._id}
          href={`/order/${o._id}`}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "0.5rem",
            padding: "0.75rem 0",
            borderBottom: "1px solid var(--line)",
            color: "inherit",
            textDecoration: "none",
          }}
        >
          <span>
            {o.restaurantName ?? "Order"}
            <br />
            <small className={styles.muted}>
              {formatPrice(o.totalInr)} · {o.mode} ·{" "}
              {new Date(o.createdAt).toLocaleDateString("en-IN")}
            </small>
          </span>
          <span
            className={`${styles.badge} ${
              o.status === "delivered" ? styles.badgeOk : styles.badgeWarn
            }`}
          >
            {o.status}
          </span>
        </Link>
      ))}
    </div>
  );
}
