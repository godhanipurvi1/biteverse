"use client";
import { use, useState, useEffect } from "react";
import { getOrder, createOrder } from "@/features/orders/orders.api";
import { useRouter } from "next/navigation";
import styles from "@/features/auth/auth.module.css";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () =>
      getOrder(id)
        .then((o) => { if (alive) setOrder(o); })
        .catch(console.error)
        .finally(() => { if (alive) setLoading(false); });
    load();
    const timer = setInterval(load, 5000);
    return () => { alive = false; clearInterval(timer); };
  }, [id]);

  const handleReorder = async () => {
    const newOrder = await createOrder(order.restaurantSlug, order.mode, order.address);
    router.push(`/order/${newOrder._id}`);
  };

  if (loading) return <div className={styles.page}>Loading...</div>;
  if (!order) return <div className={styles.page}>Order not found</div>;

  const statusSteps = ["received", "accepted", "preparing", "out-for-delivery", "delivered"];
  const currentStep = statusSteps.indexOf(order.status);

  return (
    <div className={styles.page}>
      <h1>Order #{order._id.substring(0, 8)}</h1>

      <div className={styles.card}>
        <h2>Status</h2>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", gap: "0.5rem", flexWrap: "wrap" }}>
          {statusSteps.map((step, idx) => (
            <div key={step} style={{ textAlign: "center", flex: 1, minWidth: "80px" }}>
              <div
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "50%",
                  background: idx <= currentStep ? "var(--accent)" : "var(--card)",
                  margin: "0 auto 0.5rem",
                }}
              />
              <small>{step}</small>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <h2>Items</h2>
        {order.items.map((item: any) => (
          <div key={item.menuItemName} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid var(--line)" }}>
            <span>{item.menuItemName} × {item.quantity}</span>
            <span>₹{(item.priceInr * item.quantity / 100).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <p>Subtotal: ₹{(order.subtotalInr / 100).toFixed(2)}</p>
        {order.discountInr > 0 && <p>Discount{order.couponCode ? ` (${order.couponCode})` : ""}: −₹{(order.discountInr / 100).toFixed(2)}</p>}
        <p>GST: ₹{(order.gstInr / 100).toFixed(2)}</p>
        {order.mode === "delivery" && (
          <>
            <p>Delivery: ₹{(order.deliveryFeeInr / 100).toFixed(2)}</p>
            <p>Packaging: ₹{(order.packagingInr / 100).toFixed(2)}</p>
          </>
        )}
        <p style={{ fontSize: "1.2rem", fontWeight: "bold", marginTop: "1rem" }}>Total: ₹{(order.totalInr / 100).toFixed(2)}</p>
        {order.address && <p style={{ marginTop: "1rem" }}>📍 {order.address}</p>}
      </div>

      <button onClick={handleReorder} className={styles.button} style={{ width: "100%", marginTop: "1rem" }}>Reorder</button>
    </div>
  );
}
