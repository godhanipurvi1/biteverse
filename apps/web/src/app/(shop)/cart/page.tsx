"use client";
import { useState, useEffect } from "react";
import { getCart, removeFromCart, updateCartItem, createOrder } from "@/features/orders/orders.api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/features/auth/auth.module.css";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCart().then(setCart).catch(() => setCart(null)).finally(() => setLoading(false));
  }, []);

  const handleRemove = async (name: string) => {
    const updated = await removeFromCart(name);
    setCart(updated);
  };

  const handleQuantity = async (name: string, qty: number) => {
    if (qty <= 0) {
      await handleRemove(name);
      return;
    }
    const updated = await updateCartItem(name, qty);
    setCart(updated);
  };

  const handleCheckout = async () => {
    if (mode === "delivery" && !address) {
      alert("Please enter delivery address");
      return;
    }
    const order = await createOrder(cart.restaurantSlug, mode, address);
    router.push(`/order/${order._id}`);
  };

  if (loading) return <div className={styles.page}>Loading...</div>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.page}>
        <h1>Your Cart</h1>
        <p>Cart is empty. <Link href="/restaurants">Browse restaurants</Link></p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>Your Cart</h1>
      <div className={styles.card}>
        {cart.items.map((item: any) => (
          <div key={item.menuItemName} style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <h3>{item.menuItemName}</h3>
                <p>₹{item.priceInr / 100}</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button onClick={() => handleQuantity(item.menuItemName, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => handleQuantity(item.menuItemName, item.quantity + 1)}>+</button>
                <button onClick={() => handleRemove(item.menuItemName)} className={styles.buttonOutline}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.card} style={{ marginTop: "2rem" }}>
        <h2>Totals</h2>
        <p>Subtotal: ₹{(cart.subtotalInr / 100).toFixed(2)}</p>
        <p>GST (5%): ₹{(cart.gstInr / 100).toFixed(2)}</p>
        {mode === "delivery" && (
          <>
            <p>Delivery: ₹{(cart.deliveryFeeInr / 100).toFixed(2)}</p>
            <p>Packaging: ₹{(cart.packagingInr / 100).toFixed(2)}</p>
          </>
        )}
        <p style={{ fontSize: "1.2rem", fontWeight: "bold", marginTop: "1rem" }}>Total: ₹{(cart.totalInr / 100).toFixed(2)}</p>
      </div>

      <div className={styles.card} style={{ marginTop: "2rem" }}>
        <h2>Delivery or Pickup</h2>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            <input type="radio" value="delivery" checked={mode === "delivery"} onChange={(e) => setMode(e.target.value as any)} />
            {" "}Delivery
          </label>
          <label style={{ display: "block" }}>
            <input type="radio" value="pickup" checked={mode === "pickup"} onChange={(e) => setMode(e.target.value as any)} />
            {" "}Pickup
          </label>
        </div>

        {mode === "delivery" && (
          <input
            type="text"
            placeholder="Delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={styles.input}
            style={{ marginBottom: "1rem" }}
          />
        )}

        <button onClick={handleCheckout} className={styles.button} style={{ width: "100%" }}>
          Place Order
        </button>
      </div>
    </div>
  );
}
