"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import styles from "@/features/order/order.module.css";

type OrderItem = { menuItemName: string; priceInr: number; quantity: number };

type Rider = {
  name: string;
  rating?: number;
  deliveredCount?: number;
  photoUrl?: string;
};

type Order = {
  _id: string;
  status: string;
  mode: "delivery" | "pickup";
  restaurantName?: string;
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
  rider?: Rider | null;
};

// Pickup orders skip "out-for-delivery"
const DELIVERY_STEPS = [
  { key: "placed", label: "Order placed" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing food" },
  { key: "out-for-delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];
const PICKUP_STEPS = DELIVERY_STEPS.filter((s) => s.key !== "out-for-delivery");

const POLL_MS = 5000;
const inr = (paise: number) => `₹${(paise / 100).toFixed(2)}`;
const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.state}>Loading your order...</div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className={styles.page}>
        <div className={styles.state}>
          {error || "Order not found."} <Link href="/account">Back to your orders</Link>
        </div>
      </section>
    );
  }

  const steps = order.mode === "pickup" ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentIndex = steps.findIndex((s) => s.key === order.status);
  const cancelled = order.status === "cancelled";
  const delivered = order.status === "delivered";
  const isDelivery = order.mode === "delivery";
  const shortId = order._id.slice(-8).toUpperCase();
  const restInitial = (order.restaurantName ?? "B").charAt(0);

  const headline = cancelled
    ? "This order was cancelled"
    : delivered
    ? "Enjoy your meal!"
    : "Your delicious food is on its way!";

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.title}>Track your order</h1>
          <p className={styles.subtitle}>
            {isDelivery && !cancelled && !delivered
              ? "Your order has been confirmed. We'll let you know as soon as it's on the way."
              : headline}
          </p>
          <div className={styles.meta}>
            <span className={styles.orderId}>Order ID: #{shortId}</span>
            {isDelivery && order.etaMinutes && !cancelled && (
              <span className={styles.etaInline}>
                Estimated delivery: <strong>{order.etaMinutes} min</strong>
              </span>
            )}
          </div>
        </div>

        <div className={styles.banner}>
          <p className={styles.bannerTitle}>{headline}</p>
          <p className={styles.bannerText}>
            {delivered
              ? "Thanks for ordering with BiteVerse."
              : cancelled
              ? "You can place a new order anytime."
              : "Freshly prepared. Hot. Just for you!"}
          </p>
        </div>
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
                    {current && <div className={styles.stepTime}>{time(order.createdAt)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.left}>
          {isDelivery && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Live tracking</h2>
              <div className={styles.map} aria-label="Delivery route preview">
                <svg viewBox="0 0 600 320" preserveAspectRatio="none" aria-hidden>
                  <path d="M0 240 C120 200, 160 80, 300 120 S480 260, 600 60" fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" />
                  <path d="M0 240 C120 200, 160 80, 300 120 S480 260, 600 60" fill="none" stroke="#e85d0c" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 10" />
                </svg>
                <div className={styles.pin} style={{ left: "6%", top: "58%" }}>
                  <span className={styles.pinIcon}>🍴</span>
                  {order.restaurantName ?? "Restaurant"}
                </div>
                <div className={styles.pin} style={{ right: "6%", top: "12%" }}>
                  <span className={styles.pinIcon}>⌂</span>
                  Your location
                </div>
                {order.rider && !delivered && (
                  <div className={styles.pin} style={{ left: "46%", top: "34%" }}>
                    <span className={styles.pinIcon}>●</span>
                    {order.rider.name}
                  </div>
                )}
                <span className={styles.mapNote}>Map preview. Live map coming soon.</span>
              </div>
            </div>
          )}

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Delivery partner</h2>
            {order.rider ? (
              <>
                <div className={styles.rider}>
                  <div className={styles.avatar}>
                    {order.rider.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={order.rider.photoUrl} alt={order.rider.name} />
                    ) : (
                      order.rider.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className={styles.riderName}>{order.rider.name}</p>
                    <p className={styles.muted}>Delivery partner</p>
                    {order.rider.rating && (
                      <p className={styles.rating}>★ {order.rider.rating.toFixed(1)}</p>
                    )}
                  </div>
                </div>
                <div className={styles.riderActions}>
                  <span className={`${styles.btnSolid} ${styles.btnDisabled}`}>Call rider</span>
                  <span className={`${styles.btnOutline} ${styles.btnDisabled}`}>Message rider</span>
                </div>
              </>
            ) : (
              <p className={styles.muted}>
                {delivered || isDelivery === false
                  ? "No delivery partner for this order."
                  : "A delivery partner will be assigned soon."}
              </p>
            )}
            {isDelivery && order.etaMinutes && !delivered && !cancelled && (
              <div className={styles.etaRow}>
                <span className={styles.muted}>Estimated arrival</span>
                <span className={styles.etaBig}>{order.etaMinutes} min</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.restHead}>
            <div className={styles.restThumb}>{restInitial}</div>
            <div>
              <p className={styles.restName}>{order.restaurantName ?? "Your restaurant"}</p>
              <p className={styles.muted}>
                {order.items.length} item{order.items.length === 1 ? "" : "s"} · {order.mode === "pickup" ? "Pickup" : "Delivery"}
              </p>
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
            <div className={styles.row}>
              <span>Subtotal</span>
              <span>{inr(order.subtotalInr)}</span>
            </div>
            {!!order.discountInr && (
              <div className={`${styles.row} ${styles.discount}`}>
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span>−{inr(order.discountInr)}</span>
              </div>
            )}
            {!!order.deliveryFeeInr && (
              <div className={styles.row}>
                <span>Delivery</span>
                <span>{inr(order.deliveryFeeInr)}</span>
              </div>
            )}
            {!!order.packagingInr && (
              <div className={styles.row}>
                <span>Packaging</span>
                <span>{inr(order.packagingInr)}</span>
              </div>
            )}
            {!!order.gstInr && (
              <div className={styles.row}>
                <span>GST</span>
                <span>{inr(order.gstInr)}</span>
              </div>
            )}
            <div className={styles.total}>
              <span>Total</span>
              <span>{inr(order.totalInr)}</span>
            </div>
          </div>

          {isDelivery && order.address && (
            <div className={styles.addr}>
              <p className={styles.muted} style={{ margin: 0 }}>Delivery address</p>
              <p style={{ margin: "0.25rem 0 0", color: "#111827" }}>{order.address}</p>
            </div>
          )}
          <p className={styles.muted} style={{ marginTop: "1rem" }}>
            Placed {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <Link href="/account" className={styles.action}>
          Back to your orders <span>→</span>
        </Link>
        <Link href="/contact" className={styles.action}>
          Contact support <span>→</span>
        </Link>
        <Link href="/restaurants" className={styles.action}>
          Order again <span>→</span>
        </Link>
      </div>
    </section>
  );
}