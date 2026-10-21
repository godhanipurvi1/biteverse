"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import styles from "@/features/order/order.module.css";

type OrderItem = { menuItemName: string; priceInr: number; quantity: number };

type Order = {
  _id: string;
  status: string;
  mode: "delivery" | "pickup";
  restaurantName?: string;
  restaurantSlug?: string;
  items: OrderItem[];
  subtotalInr: number;
  discountInr?: number;
  gstInr?: number;
  deliveryFeeInr?: number;
  packagingInr?: number;
  totalInr: number;
  couponCode?: string;
  address?: string;
  etaMinutes?: number;
  createdAt: string;
};

// Pickup orders skip "out-for-delivery"
const DELIVERY_STEPS = [
  { key: "placed", label: "Order placed" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "out-for-delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];
const PICKUP_STEPS = DELIVERY_STEPS.filter((s) => s.key !== "out-for-delivery");

const inr = (paise: number) => `₹${(paise / 100).toFixed(2)}`;
const POLL_MS = 5000;

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const data = await api<Order>(`/orders/${id}`);
        if (!alive) return;
        setOrder(data);
        setError("");
        // Stop polling once the order is finished or cancelled
        if (data.status !== "delivered" && data.status !== "cancelled") {
          timer = setTimeout(load, POLL_MS);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        if (alive) setError("We couldn't find this order.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  if (loading) return <section className={styles.page}><div className={styles.state}>Loading your order...</div></section>;
  if (error || !order) {
    return (
      <section className={styles.page}>
        <div className={styles.state}>
          {error || "Order not found."}{" "}
          <Link href="/account">Back to your orders</Link>
        </div>
      </section>
    );
  }

  const steps = order.mode === "pickup" ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentIndex = steps.findIndex((s) => s.key === order.status);
  const cancelled = order.status === "cancelled";
  const delivered = order.status === "delivered";
  const headline = cancelled
    ? "This order was cancelled"
    : delivered
    ? "Enjoy your meal!"
    : "Your order is on its way";

  const eta = order.etaMinutes
    ? `${order.etaMinutes} min`
    : delivered
    ? "Delivered"
    : "Updating...";

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.title}>Track your order</h1>
          <p className={styles.subtitle}>{headline}</p>
          <span className={styles.orderId}>Order #{order._id.slice(-8).toUpperCase()}</span>
        </div>
        {order.mode === "delivery" && !cancelled && (
          <div className={styles.eta}>
            <div className={styles.etaLabel}>Estimated delivery</div>
            <div className={styles.etaValue}>{eta}</div>
          </div>
        )}
      </div>

      <div className={styles.card}>
        {cancelled ? (
          <p className={styles.cancelled}>This order was cancelled.</p>
        ) : (
          <div className={styles.steps}>
            {steps.map((s, i) => {
              const done = i <= currentIndex;
              const current = i === currentIndex;
              return (
                <div
                  key={s.key}
                  className={`${styles.step} ${done ? styles.stepDone : ""} ${current ? styles.stepCurrent : ""}`}
                >
                  <div className={styles.dot}>{done ? "✓" : i + 1}</div>
                  <div>
                    <div className={styles.stepLabel}>{s.label}</div>
                    {current && (
                      <div className={styles.stepTime}>
                        {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 style={{ margin: "0 0 0.75rem" }}>Delivery details</h2>
          <p className={styles.muted}>
            {order.mode === "pickup" ? "Pickup from the restaurant" : order.address || "No address on file"}
          </p>
          <p className={styles.muted} style={{ marginTop: "0.75rem" }}>
            Placed {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.summaryHead}>
            <div>
              <p className={styles.restName}>{order.restaurantName ?? "Your restaurant"}</p>
              <p className={styles.muted}>{order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          {order.items.map((item) => (
            <div key={item.menuItemName} className={styles.item}>
              <span>
                {item.menuItemName} <span className={styles.muted}>× {item.quantity}</span>
              </span>
              <span>{inr(item.priceInr * item.quantity)}</span>
            </div>
          ))}

          <div style={{ marginTop: "0.75rem" }}>
            <div className={styles.row}><span>Subtotal</span><span>{inr(order.subtotalInr)}</span></div>
            {!!order.discountInr && (
              <div className={`${styles.row} ${styles.discount}`}>
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                <span>−{inr(order.discountInr)}</span>
              </div>
            )}
            {!!order.deliveryFeeInr && (
              <div className={styles.row}><span>Delivery</span><span>{inr(order.deliveryFeeInr)}</span></div>
            )}
            {!!order.packagingInr && (
              <div className={styles.row}><span>Packaging</span><span>{inr(order.packagingInr)}</span></div>
            )}
            {!!order.gstInr && (
              <div className={styles.row}><span>GST</span><span>{inr(order.gstInr)}</span></div>
            )}
            <div className={styles.total}>
              <span>Total</span>
              <span>{inr(order.totalInr)}</span>
            </div>
          </div>
        </div>
      </div>

      <p className={styles.muted} style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <Link href="/account">Back to your orders</Link>
      </p>
    </section>
  );
}