"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AuthError,
  fetchMyOrders,
  formatWhen,
  money,
  normaliseStatus,
  shortId,
  STEP_LABELS,
  type Order,
} from "../../lib/orders";
import styles from "./orders.module.css";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMyOrders()
      .then((list) => {
        if (!cancelled) setOrders(list);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        if (err instanceof AuthError) setNeedsLogin(true);
        else setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="container cart-page">
      <header className="cart-page-head">
        <Link href="/" className="logo">
          Bite<b>Verse</b>
        </Link>
        <Link href="/" className="tlink">
          Back to restaurants
        </Link>
      </header>

      <h1>Your orders</h1>

      {needsLogin ? (
        <div className="empty">
          <p>Log in to see the orders placed with your account.</p>
          <Link href="/login" className="inline-link">
            Log in
          </Link>
        </div>
      ) : error ? (
        <p className="field-error">{error}</p>
      ) : orders === null ? (
        <p className="fee-note">Loading your orders...</p>
      ) : orders.length === 0 ? (
        <div className="empty">
          <p>No orders yet.</p>
          <Link href="/#restaurants" className="inline-link">
            Browse restaurants
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {orders.map((o) => {
            const status = normaliseStatus(o.status);
            return (
              <li key={o._id} className={styles.card}>
                <Link href={`/orders/${o._id}`} className={styles.cardLink}>
                  <div>
                    <strong>{o.restaurantName ?? "Restaurant"}</strong>
                    <div className="meta">
                      {formatWhen(o.createdAt)} · #{shortId(o._id)}
                    </div>
                  </div>
                  <div className={styles.cardRight}>
                    <span className={styles.badge}>{STEP_LABELS[status] ?? status}</span>
                    <strong>{money(o.total ?? 0)}</strong>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}