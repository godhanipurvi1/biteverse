'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './cart.module.css';

const CART_KEY = 'biteverse-cart';
const FREE_DELIVERY_OVER = 249;
const DELIVERY_FEE = 40;
const PACKING_CHARGE = 15;
const COUPONS: Record<string, { percent: number; maxOff: number }> = {
  WELCOME10: { percent: 10, maxOff: 100 },
};

type CartLine = {
  id: string;
  name: string;
  price: number;
  qty: number;
  restaurantId: string;
  restaurantName: string;
};

type Group = { id: string; name: string; items: CartLine[]; subtotal: number };

// The stored value is either an array of lines or an object with a `lines` array.
// Read both, so this page matches whatever the cart panel saved.
function readRaw(): unknown {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadCart(): CartLine[] {
  const raw = readRaw();
  if (Array.isArray(raw)) return raw as CartLine[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { lines?: unknown }).lines)) {
    return (raw as { lines: CartLine[] }).lines;
  }
  return [];
}

// Keep the same shape the cart panel uses, so both stay in sync.
function saveCart(lines: CartLine[]) {
  try {
    const raw = readRaw();
    const value =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? { ...(raw as object), lines }
        : lines;
    localStorage.setItem(CART_KEY, JSON.stringify(value));
  } catch {
    // storage unavailable: keep the in-memory state
  }
}

const rupees = (n: number) => `₹${Math.round(n)}`;

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className={`${styles.row} ${green ? styles.rowGreen : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    setLines(loadCart());
    const saved = localStorage.getItem("biteverse-coupon"); if (saved && COUPONS[saved]) setCoupon(saved); setLoaded(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setLines(loadCart());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = (next: CartLine[]) => {
    setLines(next);
    saveCart(next);
  };

  const changeQty = (id: string, delta: number) => {
    update(
      lines
        .map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  };

  const removeLine = (id: string) => update(lines.filter((l) => l.id !== id));

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!COUPONS[code]) {
      setCouponError('Invalid coupon code');
      return;
    }
    setCoupon(code); localStorage.setItem("biteverse-coupon", code);
    setCouponInput('');
    setCouponError('');
  };

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

  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const itemTotal = groups.reduce((s, g) => s + g.subtotal, 0);
  const deliveryFee = groups.reduce((s, g) => s + (g.subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE), 0);
  const packing = groups.length * PACKING_CHARGE;
  const rule = coupon ? COUPONS[coupon] : null;
  const discount = rule ? Math.min(Math.round((itemTotal * rule.percent) / 100), rule.maxOff) : 0;
  const toPay = itemTotal - discount + deliveryFee + packing;

  const single = groups.length === 1 ? groups[0] : null;
  const remaining = single ? Math.max(0, FREE_DELIVERY_OVER - single.subtotal) : 0;
  const pct = single ? Math.min(100, (single.subtotal / FREE_DELIVERY_OVER) * 100) : 0;

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <Link href="/" className={styles.brand}>BiteVerse</Link>
        <Link href="/" className={styles.back}>← Back to restaurants</Link>
      </div>

      <ol className={styles.steps}>
        <li className={styles.stepActive}><span>1</span> Cart</li>
        <li><span>2</span> Address and payment</li>
        <li><span>3</span> Confirmed</li>
      </ol>

      {!loaded ? (
        <div className={styles.empty}>Loading your cart…</div>
      ) : lines.length === 0 ? (
        <div className={styles.empty}>
          <h2>Your cart is empty</h2>
          <p>Add dishes from a restaurant to see them here.</p>
          <Link href="/" className={styles.primaryBtn}>Browse restaurants</Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <section>
            <div className={styles.heading}>
              <div>
                <h1>Your cart</h1>
                <p className={styles.sub}>
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                  {single ? ` · Ordering from ${single.name}` : ` · ${groups.length} restaurants`}
                </p>
              </div>
              <button className={styles.ghostBtn} onClick={() => update([])}>Clear cart</button>
            </div>

            {groups.map((g) => (
              <div key={g.id} className={styles.group}>
                {groups.length > 1 && <h3 className={styles.groupName}>{g.name}</h3>}
                <div className={styles.card}>
                  {g.items.map((l) => (
                    <div key={l.id} className={styles.line}>
                      <div className={styles.thumb} aria-hidden>🍽️</div>
                      <div className={styles.lineInfo}>
                        <div className={styles.lineName}>{l.name}</div>
                        <div className={styles.lineUnit}>{rupees(l.price)} each</div>
                        <button className={styles.removeBtn} onClick={() => removeLine(l.id)}>Remove</button>
                      </div>
                      <div className={styles.lineRight}>
                        <div className={styles.qty}>
                          <button onClick={() => changeQty(l.id, -1)} aria-label={`Decrease ${l.name}`}>−</button>
                          <span>{l.qty}</span>
                          <button onClick={() => changeQty(l.id, 1)} aria-label={`Increase ${l.name}`}>+</button>
                        </div>
                        <div className={styles.lineTotal}>{rupees(l.price * l.qty)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href={`/restaurant/${g.id}`} className={styles.addMore}>
                  ← Add more items from {g.name}
                </Link>
              </div>
            ))}
          </section>

          <aside className={styles.bill}>
            <h3>Bill details</h3>

            {coupon && COUPONS[coupon] ? (
              <div className={styles.couponApplied}>
                <span>
                  {coupon} applied · {COUPONS[coupon].percent}% off up to {rupees(COUPONS[coupon].maxOff)}
                </span>
                <button onClick={() => { setCoupon(null); localStorage.removeItem("biteverse-coupon"); }}>Remove</button>
              </div>
            ) : (
              <div className={styles.couponRow}>
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                  placeholder="Coupon code"
                  aria-label="Coupon code"
                />
                <button onClick={applyCoupon}>Apply</button>
              </div>
            )}
            {couponError && <p className={styles.error}>{couponError}</p>}

            <Row label="Item total" value={rupees(itemTotal)} />
            {discount > 0 && <Row label="Coupon discount" value={`−${rupees(discount)}`} green />}
            <Row label="Delivery fee" value={deliveryFee === 0 ? 'FREE' : rupees(deliveryFee)} />
            <Row label="Packing charge" value={rupees(packing)} />

            <div className={styles.toPay}>
              <span>To pay</span>
              <span>{rupees(toPay)}</span>
            </div>

            {single && remaining > 0 && (
              <div className={styles.freeHint}>
                <p>Add {rupees(remaining)} more for free delivery</p>
                <div className={styles.bar}>
                  <div style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            <Link href="/checkout" className={styles.checkoutBtn}>Proceed to checkout</Link>
          </aside>
        </div>
      )}
    </main>
  );
}

