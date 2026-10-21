"use client";

import { useEffect, useState } from "react";
import { useCart, saveCart, groupByRestaurant, cartSubtotalOf, cartDeliveryFeeOf } from "../../lib/cart";
import { getToken } from "../../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const RUPEE = "\u20B9";

type Payment = "upi" | "card" | "cod";
const PAYMENTS: { value: Payment; label: string }[] = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "cod", label: "Cash on delivery" },
];

export default function CheckoutPage() {
  const cart = useCart();
  const groups = groupByRestaurant(cart);
  const subtotal = cartSubtotalOf(cart);
  const fee = cartDeliveryFeeOf(cart);
  const total = subtotal + fee;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<Payment>("cod");
  const [coupon, setCoupon] = useState("");
  useEffect(() => { setCoupon(window.localStorage.getItem("biteverse-coupon") ?? ""); }, []);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<{ id: string; restaurantName: string; total: number }[] | null>(null);

  async function placeOrder() {
    setMessage("");
    if (!cart || cart.lines.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }
    if (!name.trim() || phone.replace(/\D/g, "").length < 10 || !address.trim()) {
      setMessage("Please enter your name, a 10-digit phone number and a delivery address.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: "Bearer " + getToken() } : {}) },
        body: JSON.stringify({
          customer: { name: name.trim(), phone: phone.trim(), address: address.trim() },
          payment,
          couponCode: coupon.trim() || undefined,
          items: cart.lines.map((l) => ({ menuItemId: l.id, restaurantId: l.restaurantId, qty: l.qty })),
        }),
      });
      if (res.status === 404) {
        setMessage("Order service not set up yet. Nothing was placed or charged.");
        return;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setMessage(err.message ?? "Could not place the order. Please try again.");
        return;
      }
      const data = (await res.json()) as { orders: { id: string; restaurantName: string; total: number }[] };
      saveCart(null);
      window.localStorage.removeItem("biteverse-coupon");
      setPlaced(data.orders);
    } catch {
      setMessage("Could not reach the server. Check that the backend is running on port 5000.");
    } finally {
      setBusy(false);
    }
  }

  if (placed) {
    return (
      <main className="container" style={{ padding: "40px 16px", maxWidth: 720 }}>
        <h1>Order placed</h1>
        {placed.map((o) => (
          <div key={o.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <strong>{o.restaurantName}</strong>
            <div>Total {RUPEE}{o.total}</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Order ID: {o.id}</div>
            <a href={`/orders/${o.id}`} style={{ fontSize: 14 }}>Track order</a>
          </div>
        ))}
        <p style={{ fontSize: 13, opacity: 0.7 }}>This is a test build. Nothing is charged.</p>
        <a href="/">Back to home</a>
      </main>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <main className="container" style={{ padding: "40px 16px" }}>
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <a href="/#restaurants">Browse restaurants</a>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "24px 16px", maxWidth: 720 }}>
      <h1>Checkout</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Your order</h2>
        {groups.map((g) => (
          <div key={g.restaurantId} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <strong>{g.restaurantName}</strong>
            <ul style={{ listStyle: "none", padding: 0, margin: "8px 0" }}>
              {g.lines.map((l) => (
                <li key={l.id} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{l.qty} x {l.name}</span>
                  <span>{RUPEE}{l.qty * l.price}</span>
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal</span>
              <span>{RUPEE}{g.subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Delivery {g.fee === 0 ? "(free)" : ""}</span>
              <span>{RUPEE}{g.fee}</span>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Total (estimate)</span>
          <span>{RUPEE}{total}</span>
        </div>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          Delivery is Rs 40 per restaurant, free at Rs 249 or more. The final amount is calculated by the server when the order is placed.
        </p>
      </section>

      <section style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <h2>Delivery details</h2>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ display: "block", width: "100%", padding: 8 }} />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" style={{ display: "block", width: "100%", padding: 8 }} />
        </label>
        <label>
          Delivery address
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} style={{ display: "block", width: "100%", padding: 8 }} />
        </label>
      </section>

      <section style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <h2>Payment</h2>
        {PAYMENTS.map((p) => (
          <label key={p.value} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="radio" name="payment" value={p.value} checked={payment === p.value} onChange={() => setPayment(p.value)} />
            {p.label}
          </label>
        ))}
        <p style={{ fontSize: 13, opacity: 0.7 }}>Nothing is charged. This is a test build.</p>
      </section>

      <section style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <h2>Offer code</h2>
        <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="e.g. WELCOME20" style={{ padding: 8 }} />
        <p style={{ fontSize: 13, opacity: 0.7 }}>The code is checked by the server when you place the order.</p>
      </section>

      {message && <p role="status" style={{ fontWeight: 600, marginBottom: 12 }}>{message}</p>}

      <button type="button" onClick={placeOrder} disabled={busy} style={{ padding: "12px 20px", fontWeight: 700, width: "100%" }}>
        {busy ? "Placing order..." : "Place order"}
      </button>
    </main>
  );
}
