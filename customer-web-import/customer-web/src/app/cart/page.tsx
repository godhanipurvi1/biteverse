"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart, saveCart, changeQty, removeLine, groupByRestaurant } from "../../lib/cart";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const COUPON_KEY = "biteverse-coupon";
const RUPEE = "\u20B9";

type QuoteGroup = { restaurantId: string; restaurantName: string; subtotal: number; discount: number; fee: number; total: number };
type Quote = {
  groups: QuoteGroup[];
  subtotal: number;
  discount: number;
  fee: number;
  total: number;
  couponApplied: string | null;
  couponMessage: string;
};

export default function CartPage() {
  const cart = useCart();
  const lines = cart?.lines ?? [];
  const groups = groupByRestaurant(cart);
  const count = lines.reduce((n, l) => n + l.qty, 0);

  const [coupon, setCoupon] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setCoupon(window.localStorage.getItem(COUPON_KEY) ?? "");
  }, []);

  const itemsKey = JSON.stringify(lines.map((l) => [l.id, l.restaurantId, l.qty]));

  useEffect(() => {
    if (lines.length === 0) {
      setQuote(null);
      setStatus("idle");
      setError("");
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    fetch(`${API_URL}/api/orders/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: lines.map((l) => ({ menuItemId: l.id, restaurantId: l.restaurantId, qty: l.qty })),
        couponCode: coupon || undefined,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message ?? "Could not price your cart");
        setQuote(data as Quote);
        setStatus("ready");
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        if (coupon && err.message.includes("Offer code")) {
          window.localStorage.removeItem(COUPON_KEY);
          setCoupon("");
          setCouponError(err.message);
          return;
        }
        setQuote(null);
        setStatus("error");
        setError(err.message === "Failed to fetch" ? "Cannot reach the server. Check that the backend is running." : err.message);
      });
    return () => controller.abort();
  }, [itemsKey, coupon, attempt]);

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError("Enter a coupon code"); return; }
    setCouponError("");
    window.localStorage.setItem(COUPON_KEY, code);
    setCoupon(code);
    setCouponInput("");
  }

  function removeCoupon() {
    window.localStorage.removeItem(COUPON_KEY);
    setCoupon("");
    setCouponError("");
  }

  function decrease(id: string, name: string, qty: number) {
    if (qty === 1 && !window.confirm(`Remove ${name} from your cart?`)) return;
    changeQty(id, -1);
  }

  function remove(id: string, name: string) {
    if (!window.confirm(`Remove ${name} from your cart?`)) return;
    removeLine(id);
  }

  function clearAll() {
    if (!window.confirm("Remove all items from your cart?")) return;
    window.localStorage.removeItem(COUPON_KEY);
    setCoupon("");
    saveCart(null);
  }

  const canCheckout = lines.length > 0 && status === "ready" && quote !== null;
  const money = (n: number) => `${RUPEE}${n}`;

  return (
    <main className="container cart-page">
      <header className="cart-page-head">
        <Link href="/" className="logo">Bite<b>Verse</b></Link>
        <Link href="/" className="tlink">Back to restaurants</Link>
      </header>

      <h1>Your cart</h1>
      <p className="cart-from">Review your items before checkout.</p>

      {lines.length === 0 ? (
        <div className="empty">
          <p>Your cart is empty.</p>
          <Link href="/#restaurants" className="inline-link">Browse restaurants</Link>
        </div>
      ) : (
        <div className="cart-grid">
          <section className="cart-items" aria-label="Cart items">
            <p className="cart-from">
              {groups.length} {groups.length === 1 ? "restaurant" : "restaurants"} · {count} {count === 1 ? "item" : "items"}
            </p>
            {groups.map((g) => {
              const q = quote?.groups.find((x) => x.restaurantId === g.restaurantId);
              return (
                <div key={g.restaurantId}>
                  <h3 className="cart-from">
                    {g.restaurantName}{" "}
                    <span className="meta">
                      Delivery: {q ? (q.fee === 0 ? "Free" : money(q.fee)) : "calculating..."}
                    </span>
                  </h3>
                  <ul className="menu-list">
                    {g.lines.map((l) => (
                      <li key={l.id} className="menu-item">
                        <div>
                          <strong>{l.name}</strong>
                          <span className="meta">{money(l.price)} each</span>
                        </div>
                        <div className="qty">
                          <button type="button" onClick={() => decrease(l.id, l.name, l.qty)} aria-label={`Remove one ${l.name}`}>-</button>
                          <span aria-live="polite">{l.qty}</span>
                          <button type="button" onClick={() => changeQty(l.id, 1)} aria-label={`Add one ${l.name}`}>+</button>
                        </div>
                        <strong className="line-total">{money(l.price * l.qty)}</strong>
                        <button type="button" className="remove-btn" onClick={() => remove(l.id, l.name)} aria-label={`Remove ${l.name} from cart`}>
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <Link href="/#restaurants" className="inline-link">+ Add more items</Link>
          </section>

          <aside className="summary" aria-label="Order summary">
            <h2>Summary</h2>

            {status === "error" ? (
              <div>
                <p className="field-error">{error}</p>
                <button type="button" className="clear-btn" onClick={() => setAttempt((a) => a + 1)}>Try again</button>
              </div>
            ) : (
              <>
                {status === "loading" && <p className="fee-note">Updating totals...</p>}
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{quote ? money(quote.subtotal) : "—"}</span>
                </div>
                {quote && quote.discount > 0 && (
                  <div className="summary-row">
                    <span>Coupon discount</span>
                    <span>-{money(quote.discount)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Delivery fee</span>
                  <span>{quote ? (quote.fee === 0 ? "Free" : money(quote.fee)) : "—"}</span>
                </div>
                <p className="fee-note">Delivery is {money(40)} per restaurant, free at {money(249)} or more from each restaurant.</p>
                <div className="summary-row total">
                  <span>Total payable</span>
                  <span>{quote ? money(quote.total) : "—"}</span>
                </div>
              </>
            )}

            <div className="coupon-box" style={{ marginTop: 16 }}>
              {coupon ? (
                <div className="summary-row">
                  <span>Coupon <strong>{coupon}</strong></span>
                  <button type="button" className="inline-link" onClick={removeCoupon} style={{ background: "none", border: 0, cursor: "pointer" }}>Remove</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    aria-label="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code"
                    style={{ flex: 1, padding: "8px 10px", minWidth: 0 }}
                  />
                  <button type="button" className="clear-btn" onClick={applyCoupon}>Apply</button>
                </div>
              )}
              {couponError && <p className="field-error">{couponError}</p>}
              {quote?.couponMessage && <p className="fee-note">{quote.couponMessage}</p>}
            </div>

            {canCheckout ? (
              <Link href="/checkout" className="checkout">Checkout</Link>
            ) : (
              <button type="button" className="checkout" disabled>
                {lines.length === 0 ? "Cart is empty" : status === "error" ? "Fix the cart to continue" : "Updating totals..."}
              </button>
            )}
            <button type="button" className="clear-btn" onClick={clearAll}>Clear cart</button>
          </aside>
        </div>
      )}
    </main>
  );
}
