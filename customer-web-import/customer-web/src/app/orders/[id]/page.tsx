"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AuthError,
  fetchOrder,
  formatWhen,
  isCancelled,
  isFinal,
  money,
  normaliseStatus,
  orderLines,
  shortId,
  STEP_LABELS,
  STEPS,
  type Order,
} from "../../../lib/orders";
import styles from "../orders.module.css";

const POLL_MS = 10_000;

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="container cart-page">
      <header className="cart-page-head">
        <Link href="/" className="logo">
          Bite<b>Verse</b>
        </Link>
        <Link href="/orders" className="tlink">
          Your orders
        </Link>
      </header>
      {children}
    </main>
  );
}

export default function OrderTrackPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    if (!id) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const next = await fetchOrder(id);
        if (stopped) return;
        setOrder(next);
        setError("");
        if (!isFinal(normaliseStatus(next.status))) timer = setTimeout(load, POLL_MS);
      } catch (err) {
        if (stopped) return;
        if (err instanceof AuthError) {
          setNeedsLogin(true);
          return;
        }
        setError((err as Error).message);
        timer = setTimeout(load, POLL_MS);
      }
    }

    load();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  if (needsLogin) {
    return (
      <Shell>
        <div className="empty">
          <p>Log in to track this order.</p>
          <Link href="/login" className="inline-link">
            Log in
          </Link>
        </div>
      </Shell>
    );
  }

  if (!order) {
    return (
      <Shell>
        {error ? <p className="field-error">{error}</p> : <p className="fee-note">Loading your order...</p>}
        <Link href="/orders" className="inline-link">
          Back to your orders
        </Link>
      </Shell>
    );
  }

  const status = normaliseStatus(order.status);
  const cancelled = isCancelled(status);
  const current = STEPS.indexOf(status);
  const lines = orderLines(order);
  const subtotal =
    order.subtotal ?? lines.reduce((n, l) => n + (l.lineTotal ?? (l.price ?? 0) * l.qty), 0);
  const discount = order.discount ?? 0;
  const fee = order.fee ?? 0;
  const total = order.total ?? subtotal - discount + fee;

  return (
    <Shell>
      <Link href="/orders" className="inline-link">
        Back to your orders
      </Link>
      <h1>{order.restaurantName ?? "Your order"}</h1>
      <p className="meta">
        Order #{shortId(order._id)} · {formatWhen(order.createdAt)}
      </p>

      <div className={styles.layout}>
        <section>
          <h2 className={styles.headline}>{STEP_LABELS[status] ?? status}</h2>

          {error && <p className="field-error">{error}</p>}

          {cancelled ? (
            <p className="field-error">
              This order was cancelled.
              {order.cancelReason ? ` Reason: ${order.cancelReason}` : ""}
            </p>
          ) : (
            <ol className={styles.steps} aria-label="Order progress">
              {STEPS.map((step, i) => {
                const state = i < current ? "done" : i === current ? "current" : "upcoming";
                const at = order.statusHistory?.find(
                  (h) => normaliseStatus(h.status) === step
                )?.at;
                return (
                  <li
                    key={step}
                    className={`${styles.step} ${styles[state]}`}
                    aria-current={state === "current" ? "step" : undefined}
                  >
                    <span className={styles.dot} aria-hidden="true" />
                    <div>
                      <div className={styles.stepTitle}>{STEP_LABELS[step]}</div>
                      {at && <div className="meta">{formatWhen(at)}</div>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {!isFinal(status) && (
            <p className="fee-note">Updates automatically every 10 seconds.</p>
          )}
        </section>

        <aside className="summary" aria-label="Order summary">
          <h2>Items</h2>
          <ul className="menu-list">
            {lines.map((l, idx) => (
              <li key={`${l.name}-${idx}`} className="menu-item">
                <div>
                  <strong>{l.name}</strong>
                  <span className="meta"> × {l.qty}</span>
                </div>
                <strong className="line-total">
                  {money(l.lineTotal ?? (l.price ?? 0) * l.qty)}
                </strong>
              </li>
            ))}
          </ul>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="summary-row">
              <span>{order.couponCode ? `Coupon ${order.couponCode}` : "Discount"}</span>
              <span>-{money(discount)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Delivery fee</span>
            <span>{fee === 0 ? "Free" : money(fee)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>

          {order.paymentMethod && <p className="fee-note">Payment: {order.paymentMethod}</p>}
          {order.address && <p className="fee-note">Delivering to: {order.address}</p>}
        </aside>
      </div>
    </Shell>
  );
}