"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getCart,
  removeFromCart,
  updateCartItem,
  createOrder,
  applyCoupon,
  removeCoupon,
} from "@/features/orders/orders.api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/features/auth/auth.module.css";

type Mode = "delivery" | "pickup";
const inr = (paise: number) => `₹${(paise / 100).toFixed(2)}`;
const message = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [mode, setMode] = useState<Mode>("delivery");
  const [address, setAddress] = useState("");
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (m: Mode) => {
    try {
      setCart(await getCart(m));
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(mode);
  }, [mode, load]);

  const handleRemove = async (name: string) => {
    await removeFromCart(name);
    await load(mode);
  };

  const handleQuantity = async (name: string, qty: number) => {
    if (qty <= 0) return handleRemove(name);
    await updateCartItem(name, qty);
    await load(mode);
  };

  const onApply = async () => {
    setBusy(true);
    setCouponError(null);
    try {
      setCart(await applyCoupon(code, mode));
      setCode("");
    } catch (e) {
      setCouponError(message(e, "Could not apply the coupon"));
    } finally {
      setBusy(false);
    }
  };

  const onRemoveCoupon = async () => {
    setCouponError(null);
    try {
      setCart(await removeCoupon(mode));
    } catch (e) {
      setCouponError(message(e, "Could not remove the coupon"));
    }
  };

  const handleCheckout = async () => {
    if (mode === "delivery" && !address) {
      setError("Please enter a delivery address");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const order = await createOrder(cart.restaurantSlug, mode, address);
      router.push(`/order/${order._id}`);
    } catch (e) {
      setError(message(e, "Could not place the order"));
      setBusy(false);
    }
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
                <p>{inr(item.priceInr)}</p>
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
        <h2>Coupon</h2>
        {cart.couponCode ? (
          <p className={styles.success}>
            {cart.couponCode} applied. <button className={styles.linkButton} onClick={onRemoveCoupon}>Remove</button>
          </p>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              className={styles.input}
              placeholder="Enter coupon code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button className={styles.buttonSmall} onClick={onApply} disabled={busy || !code.trim()}>
              Apply
            </button>
          </div>
        )}
        {couponError && <p className={styles.error}>{couponError}</p>}
        {cart.couponNote && <p className={styles.muted}>{cart.couponNote}</p>}
        <p className={styles.muted}>
          <Link href="/offers">See all offers</Link>
        </p>
      </div>

      <div className={styles.card} style={{ marginTop: "2rem" }}>
        <h2>Totals</h2>
        <p>Subtotal: {inr(cart.subtotalInr)}</p>
        {cart.discountInr > 0 && <p className={styles.success}>Discount ({cart.couponCode}): −{inr(cart.discountInr)}</p>}
        <p>GST (5%): {inr(cart.gstInr)}</p>
        {mode === "delivery" && (
          <>
            <p>Delivery: {inr(cart.deliveryFeeInr)}</p>
            <p>Packaging: {inr(cart.packagingInr)}</p>
          </>
        )}
        <p style={{ fontSize: "1.2rem", fontWeight: "bold", marginTop: "1rem" }}>Total: {inr(cart.totalInr)}</p>
      </div>

      <div className={styles.card} style={{ marginTop: "2rem" }}>
        <h2>Delivery or Pickup</h2>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            <input type="radio" value="delivery" checked={mode === "delivery"} onChange={() => setMode("delivery")} />
            {" "}Delivery
          </label>
          <label style={{ display: "block" }}>
            <input type="radio" value="pickup" checked={mode === "pickup"} onChange={() => setMode("pickup")} />
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

        {error && <p className={styles.error}>{error}</p>}
        <button onClick={handleCheckout} className={styles.button} style={{ width: "100%" }} disabled={busy}>
          {busy ? "Please wait..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
