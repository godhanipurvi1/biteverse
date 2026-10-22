'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import styles from './checkout.module.css';
import { saveCart } from '../../lib/cart';

const CART_KEY = 'biteverse-cart';
const COUPON_KEY = 'biteverse-coupon';
const ORDER_KEY = 'biteverse-last-order';
const FREE_DELIVERY_OVER = 249;
const DELIVERY_FEE = 40;
const PACKING_CHARGE = 15;
const COUPONS: Record<string, { percent: number; maxOff: number }> = {
  WELCOME10: { percent: 10, maxOff: 100 },
};
const INSTRUCTIONS = ['Leave at the door', 'Call on arrival', 'Ring the bell'];

type CartLine = {
  id: string;
  name: string;
  price: number;
  qty: number;
  restaurantId: string;
  restaurantName: string;
};

type Group = { id: string; name: string; items: CartLine[]; subtotal: number };
type Method = 'upi' | 'card' | 'cod';

// Same reader as the cart page: accepts an array or an object with a `lines` array.
function readCart(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) ?? 'null');
    if (Array.isArray(raw)) return raw as CartLine[];
    if (raw && Array.isArray(raw.lines)) return raw.lines as CartLine[];
  } catch {
    // unreadable storage: treat as empty
  }
  return [];
}

const rupees = (n: number) => `₹${Math.round(n)}`;

export default function CheckoutPage() {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [address, setAddress] = useState<'home' | 'work'>('home');
  const [instruction, setInstruction] = useState(INSTRUCTIONS[0]);
  const [method, setMethod] = useState<Method>('upi');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    setLines(readCart());
    try {
      const saved = localStorage.getItem(COUPON_KEY);
      if (saved && COUPONS[saved]) setCoupon(saved);
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const l of lines) {
      const g = map.get(l.restaurantId) ?? { id: l.restaurantId, name: l.restaurantName, items: [], subtotal: 0 };
      g.items.push(l);
      g.subtotal += l.price * l.qty;
      map.set(l.restaurantId, g);
    }
    return Array.from(map.values());
  }, [lines]);

  const itemTotal = groups.reduce((s, g) => s + g.subtotal, 0);
  const deliveryFee = groups.reduce((s, g) => s + (g.subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE), 0);
  const packing = groups.length * PACKING_CHARGE;
  const rule = coupon ? COUPONS[coupon] : null;
  const discount = rule ? Math.min(Math.round((itemTotal * rule.percent) / 100), rule.maxOff) : 0;
  const toPay = itemTotal - discount + deliveryFee + packing;

  function placeOrder() {
    if (placing || lines.length === 0) return;
    setPlacing(true);
    const orderId = `BV-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      localStorage.setItem(
        ORDER_KEY,
        JSON.stringify({
          orderId,
          total: toPay,
          method,
          address,
          instruction,
          coupon,
          restaurants: groups.map((g) => g.name),
          items: lines,
          createdAt: new Date().toISOString(),
        })
      );
      saveCart(null);
      localStorage.removeItem(COUPON_KEY);
    } catch {
      // storage unavailable: the order page will show a generic message
    }
    router.push(`/order-confirmed?order=${orderId}`);
  }

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <Link href="/" className={styles.brand}>BiteVerse</Link>
        <Link href="/cart" className={styles.back}>← Back to cart</Link>
      </div>

      <ol className={styles.steps}>
        <li><span>✓</span> Cart</li>
        <li className={styles.stepActive}><span>2</span> Address and payment</li>
        <li><span>3</span> Confirmed</li>
      </ol>

      {!loaded ? (
        <div className={styles.empty}>Loading checkout…</div>
      ) : lines.length === 0 ? (
        <div className={styles.empty}>
          <h2>Nothing to check out</h2>
          <p>Your cart is empty.</p>
          <Link href="/" className={styles.primaryBtn}>Browse restaurants</Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <section>
            <h1>Address and payment</h1>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h3>Delivery address</h3>
              </div>
              {(['home', 'work'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.option} ${address === key ? styles.optionOn : ''}`}
                  onClick={() => setAddress(key)}
                  aria-pressed={address === key}
                >
                  <span className={styles.radio} />
                  <span>
                    <strong>{key === 'home' ? 'Home' : 'Work'}</strong>
                    <small>{key === 'home' ? 'House number, street, area' : 'Office address'}</small>
                  </span>
                </button>
              ))}
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h3>Delivery instructions</h3>
                <span className={styles.muted}>Optional</span>
              </div>
              <div className={styles.chips}>
                {INSTRUCTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={instruction === t ? styles.chipOn : styles.chip}
                    onClick={() => setInstruction(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h3>Payment method</h3>
                <span className={styles.muted}>All payments are secure</span>
              </div>
              {([
                ['upi', 'UPI', 'Pay with any UPI app'],
                ['card', 'Credit or debit card', 'Visa, Mastercard, RuPay'],
                ['cod', 'Cash on delivery', 'Pay when your order arrives'],
              ] as const).map(([key, label, sub]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.option} ${method === key ? styles.optionOn : ''}`}
                  onClick={() => setMethod(key)}
                  aria-pressed={method === key}
                >
                  <span className={styles.radio} />
                  <span>
                    <strong>{label}</strong>
                    <small>{sub}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <aside className={styles.summary}>
            <h3>Order summary</h3>
            {groups.map((g) => (
              <div key={g.id} className={styles.groupBlock}>
                {groups.length > 1 && <div className={styles.groupName}>{g.name}</div>}
                {g.items.map((l) => (
                  <div key={l.id} className={styles.row}>
                    <span>{l.name} × {l.qty}</span>
                    <span>{rupees(l.price * l.qty)}</span>
                  </div>
                ))}
              </div>
            ))}

            <div className={styles.divider} />
            <div className={styles.row}><span>Item total</span><span>{rupees(itemTotal)}</span></div>
            {discount > 0 && (
              <div className={`${styles.row} ${styles.green}`}>
                <span>Coupon {coupon}</span><span>−{rupees(discount)}</span>
              </div>
            )}
            <div className={styles.row}><span>Delivery fee</span><span>{deliveryFee === 0 ? 'FREE' : rupees(deliveryFee)}</span></div>
            <div className={styles.row}><span>Packing charge</span><span>{rupees(packing)}</span></div>

            <div className={styles.toPay}>
              <span>To pay</span>
              <span>{rupees(toPay)}</span>
            </div>

            <button type="button" className={styles.payBtn} onClick={placeOrder} disabled={placing}>
              {placing ? 'Placing order…' : `Pay ${rupees(toPay)}`}
            </button>
            <p className={styles.note}>
              {method === 'cod' ? 'You will pay in cash when your order arrives.' : 'You will confirm the payment in the next step.'}
            </p>
            <Link href="/cart" className={styles.editLink}>Edit cart</Link>
          </aside>
        </div>
      )}
    </main>
  );
}

