"use client";

import Link from "next/link";
import {
  useCart,
  changeQty,
  removeLine,
  groupByRestaurant,
  cartSubtotalOf,
  cartDeliveryFeeOf,
} from "../lib/cart";
import styles from "./dashboard-cart.module.css";

const RUPEE = "\u20B9";
const money = (n: number) => `${RUPEE}${Math.round(n)}`;

export function DashboardCart() {
  const cart = useCart();
  const lines = cart?.lines ?? [];

  if (lines.length === 0) {
    return (
      <section className={styles.panel} aria-labelledby="dash-cart-title">
        <div className={styles.head}>
          <h2 id="dash-cart-title">Your cart</h2>
        </div>
        <div className={styles.empty}>
          Your cart is empty. <Link href="/#restaurants">Browse restaurants</Link>
        </div>
      </section>
    );
  }

  const groups = groupByRestaurant(cart);
  const subtotal = cartSubtotalOf(cart);
  const delivery = cartDeliveryFeeOf(cart);

  return (
    <section className={styles.panel} aria-labelledby="dash-cart-title">
      <div className={styles.head}>
        <h2 id="dash-cart-title">Your cart</h2>
        <Link href="/cart" className={styles.link}>Open full cart</Link>
      </div>

      {groups.map((g) => (
        <div key={g.restaurantId} className={styles.group}>
          <p className={styles.restaurant}>{g.restaurantName}</p>
          <ul className={styles.lines}>
            {g.lines.map((l) => (
              <li key={l.id} className={styles.line}>
                <span className={styles.name}>{l.name}</span>
                <span className={styles.stepper}>
                  <button type="button" onClick={() => changeQty(l.id, -1)} aria-label={`Decrease ${l.name}`}>-</button>
                  <span aria-live="polite">{l.qty}</span>
                  <button type="button" onClick={() => changeQty(l.id, 1)} aria-label={`Increase ${l.name}`}>+</button>
                </span>
                <span className={styles.price}>{money(l.price * l.qty)}</span>
                <button type="button" className={styles.remove} onClick={() => removeLine(l.id)} aria-label={`Remove ${l.name}`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <p className={styles.meta}>Delivery {money(g.fee)}</p>
        </div>
      ))}

      <div className={styles.total}>
        <span>Subtotal</span>
        <span>{money(subtotal)}</span>
      </div>
      <div className={styles.meta}>
        Delivery total {money(delivery)}
      </div>

      <Link href="/checkout" className={styles.cta}>Checkout</Link>
    </section>
  );
}
