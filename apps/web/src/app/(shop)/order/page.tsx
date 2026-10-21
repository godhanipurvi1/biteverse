"use client";
import { useState, useEffect } from "react";
import { getOrders } from "@/features/orders/orders.api";
import Link from "next/link";
import styles from "@/features/auth/auth.module.css";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.page}>Loading...</div>;
  if (orders.length === 0) {
    return (
      <div className={styles.page}>
        <h1>Your Orders</h1>
        <p>No orders yet. <Link href="/restaurants">Start ordering</Link></p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>Your Orders</h1>
      {orders.map((order: any) => (
        <Link key={order._id} href={`/order/${order._id}`}>
          <div className={styles.card} style={{ cursor: "pointer", marginBottom: "1rem" }}>
            <h3>{order.restaurantSlug} · {order.mode}</h3>
            <p>Status: <strong>{order.status}</strong></p>
            <p>₹{(order.totalInr / 100).toFixed(2)} · {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
