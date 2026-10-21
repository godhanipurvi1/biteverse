"use client";

import Icon from "./Icon";
import Link from "next/link";
import type { RestaurantGroup } from "../lib/cart";

export type CartLine = { id: string; name: string; price: number; qty: number };

type Props = {
  open: boolean;
  groups: RestaurantGroup[];
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  onChange: (id: string, delta: number) => void;
  onClear: () => void;
  onClose: () => void;
};

export default function CartPanel({ open, groups, lines, subtotal, deliveryFee, onChange, onClear, onClose }: Props) {
  return (
    <>
      <div className={`scrim ${open ? "show" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`cart-panel ${open ? "open" : ""}`} aria-label="Your cart">
        <div className="cart-head">
          <h2>Your cart</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close cart">
            <Icon name="close" />
          </button>
        </div>
        {lines.length === 0 ? (
          <p className="meta">Your cart is empty. Add items from a restaurant.</p>
        ) : (
          <div className="cart-body">
            {groups.map((g) => (
            <div key={g.restaurantId}>
            <p className="cart-from">From {g.restaurantName}</p>
            <ul className="menu-list">
              {g.lines.map((l) => (
                <li key={l.id} className="menu-item">
                  <div>
                    <strong>{l.name}</strong>
                    <span className="meta">{"\u20B9"}{l.price * l.qty}</span>
                  </div>
                  <div className="qty">
                    <button type="button" onClick={() => onChange(l.id, -1)} aria-label={`Remove one ${l.name}`}>-</button>
                    <span>{l.qty}</span>
                    <button type="button" onClick={() => onChange(l.id, 1)} aria-label={`Add one ${l.name}`}>+</button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="meta">Delivery from {g.restaurantName}: {g.fee === 0 ? "Free" : `\u20B9${g.fee}`}</p>
            </div>
            ))}
            <p className="cart-total">
              <span>Subtotal</span>
              <strong>{"\u20B9"}{subtotal}</strong>
            </p>
            <p className="cart-total">
              <span>Delivery</span>
              <strong>{deliveryFee === 0 ? "Free" : `\u20B9${deliveryFee}`}</strong>
            </p>
            <p className="meta">Offers are applied at checkout.</p>
            <button type="button" className="clear-btn" onClick={onClear}>
              Clear cart
            </button>
          </div>
        )}
        <Link href="/cart" className="view-cart">View full cart</Link>
        <Link href="/checkout" className="checkout">
          Checkout
        </Link>
      </aside>
    </>
  );
}
