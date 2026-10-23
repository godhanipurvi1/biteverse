"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import styles from "./cart.module.css";

export type CartItem = {
  id: string;
  name: string;
  restaurant: string;
  pricePaise: number;
  qty: number;
};

type PayMethod = "upi" | "card" | "cod";

const PAYMENTS: { value: PayMethod; label: string; hint: string }[] = [
  { value: "upi", label: "UPI", hint: "Pay with any UPI app" },
  { value: "card", label: "Card", hint: "Debit or credit card" },
  { value: "cod", label: "Cash on delivery", hint: "Pay when your food arrives" },
];

const DELIVERY_FEE_PAISE = 3900;
const TAX_BPS = 500; // 5 percent, in basis points

function rupees(paise: number): string {
  return "\u20B9" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function CartView({ initialItems }: { initialItems: CartItem[] }) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [pay, setPay] = useState<PayMethod>("upi");
  const [notice, setNotice] = useState("");

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.pricePaise * i.qty, 0),
    [items]
  );
  const delivery = items.length > 0 ? DELIVERY_FEE_PAISE : 0;
  const tax = Math.round((subtotal * TAX_BPS) / 10000);
  const total = subtotal + delivery + tax;

  function setQty(id: string, qty: number) {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty } : i))
    );
  }

  function onPlace(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice("Checkout is not connected yet, so your order was not placed.");
  }

  if (items.length === 0) {
    return (
      <section className={`card ${styles.empty}`}>
        <div className={styles.emptyIcon} aria-hidden="true">
          <svg viewBox="0 0 64 64" width="72" height="72">
            <path d="M12 28a20 16 0 0 1 40 0z" fill="#e0a458" />
            <rect x="10" y="32" width="44" height="5" rx="2.5" fill="#4caf50" />
            <rect x="12" y="38" width="40" height="7" rx="3" fill="#7a3e22" />
            <rect x="10" y="46" width="44" height="7" rx="3.5" fill="#e0a458" />
          </svg>
        </div>
        <h2>Your cart is empty</h2>
        <p className="muted">Pick a restaurant and add a few dishes. They will show up here.</p>
        <Link href="/restaurants" className="btn btn-primary">Browse restaurants</Link>
      </section>
    );
  }

  return (
    <form onSubmit={onPlace} className={styles.layout}>
      <div className={styles.main}>
        <section className={`card ${styles.panel}`} aria-labelledby="items-title">
          <h2 id="items-title" className={styles.panelTitle}>Items</h2>
          {items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemMeta}>{item.restaurant} - {rupees(item.pricePaise)}</div>
                <div className={styles.stepper}>
                  <button type="button" onClick={() => setQty(item.id, item.qty - 1)} aria-label={`Decrease ${item.name}`}>-</button>
                  <span aria-live="polite">{item.qty}</span>
                  <button type="button" onClick={() => setQty(item.id, item.qty + 1)} aria-label={`Increase ${item.name}`}>+</button>
                </div>
              </div>
              <div className={styles.lineTotal}>{rupees(item.pricePaise * item.qty)}</div>
            </div>
          ))}
        </section>

        <section className={`card ${styles.panel}`} aria-labelledby="delivery-title">
          <h2 id="delivery-title" className={styles.panelTitle}>Delivery details</h2>
          <div className={styles.fields}>
            <label className={styles.field}>
              Full name
              <input name="name" autoComplete="name" required />
            </label>
            <label className={styles.field}>
              Mobile number
              <input name="mobile" type="tel" autoComplete="tel" inputMode="tel" required />
            </label>
            <label className={styles.field}>
              Address
              <textarea name="address" rows={3} autoComplete="street-address" required />
            </label>
          </div>
        </section>

        <fieldset className={`card ${styles.panel}`}>
          <legend className={styles.panelTitle}>Payment</legend>
          <div className={styles.options}>
            {PAYMENTS.map((m) => (
              <label key={m.value} className={styles.option} data-on={pay === m.value}>
                <input
                  type="radio"
                  name="payment"
                  value={m.value}
                  checked={pay === m.value}
                  onChange={() => setPay(m.value)}
                />
                <span>
                  <span>{m.label}</span>
                  <span className={styles.itemMeta}> - {m.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className={`card ${styles.summary}`} aria-label="Order summary">
        <h2 className={styles.panelTitle}>Summary</h2>
        <div className={styles.row}><span>Subtotal</span><span>{rupees(subtotal)}</span></div>
        <div className={styles.row}><span>Delivery fee</span><span>{rupees(delivery)}</span></div>
        <div className={styles.row}><span>Taxes (5%)</span><span>{rupees(tax)}</span></div>
        <div className={`${styles.row} ${styles.total}`}><span>Total</span><span>{rupees(total)}</span></div>
        <button type="submit" className={`btn btn-primary ${styles.placeBtn}`}>Place order</button>
        {notice && <p className={styles.notice} role="status">{notice}</p>}
      </aside>
    </form>
  );
}
