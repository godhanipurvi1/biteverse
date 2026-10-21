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

  if (loading) return <section className={styles.page}><p className={styles.muted}>Loading cart...</p></section>;

  if (!cart || cart.items.length === 0) {
    return (
      <section className={styles.page}>
        <h1>Your cart</h1>
        <div className={styles.card} style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Your cart is empty.</p>
          <Link href="/restaurants" className={styles.button}>
            Browse restaurants
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.pageWide}>
      <div className={styles.panelHeader}>
        <div>
          <h1>Your cart</h1>
          <p className={styles.muted}>From {cart.restaurantName ?? cart.restaurantSlug}</p>
        </div>
        <Link href="/restaurants" className={styles.buttonOutline}>
          Add more items
        </Link>
      </div>

      <div className={styles.grid} style={{ marginTop: "1.5rem", alignItems: "start" }}>
        {/* Left column: items, coupon */}
        <div>
          <div className={styles.card}>
            <h2 style={{ marginBottom: "0.5rem" }}>Items</h2>
            {cart.items.map((item: any) => (
              <div
                key={item.menuItemName}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.9rem 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <strong>{item.menuItemName}</strong>
                  <p className={styles.muted} style={{ fontSize: "0.9rem" }}>
                    {inr(item.priceInr)} each
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button
                    className={styles.buttonSmall}
                    onClick={() => handleQuantity(item.menuItemName, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span style={{ minWidth: "1.5rem", textAlign: "center" }}>{item.quantity}</span>
                  <button
                    className={styles.buttonSmall}
                    onClick={() => handleQuantity(item.menuItemName, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                  <button
                    className={styles.buttonOutline}
                    onClick={() => handleRemove(item.menuItemName)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.card} style={{ marginTop: "1.5rem" }}>
            <h2 style={{ marginBottom: "0.5rem" }}>Coupon</h2>
            {cart.couponCode ? (
              <p className={styles.success}>
                {cart.couponCode} applied.{" "}
                <button className={styles.linkButton} onClick={onRemoveCoupon}>
                  Remove
                </button>
              </p>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className={styles.input}
                  placeholder="Enter coupon code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <button
                  className={styles.buttonSmall}
                  onClick={onApply}
                  disabled={busy || !code.trim()}
                >
                  Apply
                </button>
              </div>
            )}
            {couponError && <p className={styles.error}>{couponError}</p>}
            {cart.couponNote && <p className={styles.muted}>{cart.couponNote}</p>}
            <p className={styles.muted} style={{ marginTop: "0.5rem" }}>
              <Link href="/offers">See all offers</Link>
            </p>
          </div>
        </div>

        {/* Right column: totals, mode, checkout */}
        <div>
          <div className={styles.card}>
            <h2 style={{ marginBottom: "0.5rem" }}>Order summary</h2>
            <dl style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.4rem 1rem" }}>
              <dt>Subtotal</dt>
              <dd style={{ margin: 0, textAlign: "right" }}>{inr(cart.subtotalInr)}</dd>
              {cart.discountInr > 0 && (
                <>
                  <dt className={styles.success}>Discount ({cart.couponCode})</dt>
                  <dd className={styles.success} style={{ margin: 0, textAlign: "right" }}>
                    −{inr(cart.discountInr)}
                  </dd>
                </>
              )}
              <dt>GST (5%)</dt>
              <dd style={{ margin: 0, textAlign: "right" }}>{inr(cart.gstInr)}</dd>
              {mode === "delivery" && (
                <>
                  <dt>Delivery</dt>
                  <dd style={{ margin: 0, textAlign: "right" }}>{inr(cart.deliveryFeeInr)}</dd>
                  <dt>Packaging</dt>
                  <dd style={{ margin: 0, textAlign: "right" }}>{inr(cart.packagingInr)}</dd>
                </>
              )}
            </dl>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid var(--line)",
                fontSize: "1.2rem",
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span>{inr(cart.totalInr)}</span>
            </div>
          </div>

          <div className={styles.card} style={{ marginTop: "1.5rem" }}>
            <h2 style={{ marginBottom: "0.75rem" }}>Delivery or pickup</h2>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <button
                className={mode === "delivery" ? styles.button : styles.buttonOutline}
                onClick={() => setMode("delivery")}
                style={{ flex: 1 }}
              >
                Delivery
              </button>
              <button
                className={mode === "pickup" ? styles.button : styles.buttonOutline}
                onClick={() => setMode("pickup")}
                style={{ flex: 1 }}
              >
                Pickup
              </button>
            </div>

            {mode === "delivery" && (
              <label className={styles.field}>
                Delivery address
                <input
                  type="text"
                  placeholder="House no., street, area"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={styles.input}
                />
              </label>
            )}

            {error && <p className={styles.error}>{error}</p>}
            <button
              onClick={handleCheckout}
              className={styles.button}
              style={{ width: "100%", marginTop: "1rem" }}
              disabled={busy}
            >
              {busy ? "Placing order..." : `Place order · ${inr(cart.totalInr)}`}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}