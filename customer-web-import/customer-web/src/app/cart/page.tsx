'use client';

import Footer from '../../components/Footer';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useCart, changeQty, removeLine, groupByRestaurant } from '../../lib/cart';
import styles from './cart.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const COUPON_KEY = 'biteverse-coupon';
const OFFER_CODES = ['WELCOME10'];

type Quote = {
  subtotal: number;
  discount: number;
  fee: number;
  tax?: number;
  total: number;
  couponApplied: string | null;
  couponMessage?: string;
};

const rupees = (n: number) => `₹${Math.round(n)}`;

function emojiFor(name: string) {
  const n = name.toLowerCase();
  if (n.includes('pizza')) return '🍕';
  if (n.includes('bread')) return '🥖';
  if (n.includes('burger')) return '🍔';
  if (n.includes('biryani') || n.includes('rice')) return '🍚';
  if (n.includes('dosa')) return '🥞';
  if (n.includes('noodle') || n.includes('fried')) return '🍜';
  return '🍽️';
}

const PHOTO_EXTS = ['jpg', 'png', 'webp', 'jpeg'];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function imageOf(l: unknown): string | undefined {
  const v = l as { image?: unknown; imageUrl?: unknown };
  if (typeof v.image === 'string' && v.image) return v.image;
  if (typeof v.imageUrl === 'string' && v.imageUrl) return v.imageUrl;
  return undefined;
}

function FoodThumb({ name, image }: { name: string; image?: string }) {
  const [tryIdx, setTryIdx] = useState(0);
  const candidates = image
    ? [image]
    : PHOTO_EXTS.map((x) => `/images/food/${slugify(name)}.${x}`);
  if (tryIdx >= candidates.length) {
    return <div className={styles.thumb} aria-hidden="true">{emojiFor(name)}</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.photo}
      src={candidates[tryIdx]}
      alt={name}
      onError={() => setTryIdx((i) => i + 1)}
    />
  );
}

export default function CartPage() {
  const cart = useCart();
  const lines = cart?.lines ?? [];
  const groups = useMemo(() => groupByRestaurant(cart), [cart]);
  const itemsKey = lines.map((l) => `${l.restaurantId}:${l.id}:${l.qty}`).join('|');
  const count = lines.reduce((n, l) => n + l.qty, 0);

  const [loaded, setLoaded] = useState(false);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COUPON_KEY);
      if (saved) setCoupon(saved);
    } catch {
      // storage unavailable
    }
    setLoaded(true);
  }, []);

  function priceCart(code: string | null): Promise<Quote> {
    return fetch(`${API_URL}/api/orders/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: lines.map((l) => ({ restaurantId: l.restaurantId, menuItemId: l.id, qty: l.qty })),
        couponCode: code ?? '',
      }),
    }).then(async (res) => {
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Could not price your cart (${res.status})`);
      return json as Quote;
    });
  }

  useEffect(() => {
    if (!loaded) return;
    if (lines.length === 0) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setQuoteError('');
    priceCart(coupon)
      .then((q) => {
        if (!cancelled) setQuote(q);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setQuoteError(
            err.message === 'Failed to fetch'
              ? 'Could not reach the server. Check that the API is running on port 5000.'
              : err.message
          );
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, itemsKey, coupon]);

  function applyCoupon(code: string) {
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    priceCart(clean)
      .then((q) => {
        if (q.couponApplied === clean) {
          setCoupon(clean);
          setCouponMsg('');
          setCodeInput('');
          try {
            localStorage.setItem(COUPON_KEY, clean);
          } catch {
            // ignore
          }
        } else {
          setCouponMsg(q.couponMessage || 'That code is not valid for this cart.');
        }
      })
      .catch((err: Error) => setCouponMsg(err.message));
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponMsg('');
    try {
      localStorage.removeItem(COUPON_KEY);
    } catch {
      // ignore
    }
  }

  if (!loaded) {
    return (
      <main className={styles.page}>
        <p className={styles.muted}>Loading cart…</p>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main className={styles.page}>
        <Link href="/" className={styles.back}>← Back to menu</Link>
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Your cart is empty</h2>
          <p className={styles.muted}>Add something from a restaurant to get started.</p>
          <Link href="/" className={styles.primary}>Browse restaurants</Link>
        </div>
      </main>
    );
  }

  return (
    <><main className={styles.page}>
      <Link href="/" className={styles.back}>← Back to menu</Link>
      <h1 className={styles.title}>Your cart</h1>
      <p className={styles.sub}>
        From <strong>{groups.map((g) => g.restaurantName).join(', ')}</strong> · {count} {count === 1 ? 'item' : 'items'}
      </p>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Your items</h3>
            {groups.map((g) => (
              <div key={g.restaurantId} className={styles.group}>
                {groups.length > 1 && <div className={styles.groupName}>{g.restaurantName}</div>}
                {g.lines.map((l) => (
                  <div key={`${l.restaurantId}:${l.id}`} className={styles.row}>
                    <FoodThumb name={l.name} image={imageOf(l)} />
                    <div className={styles.itemInfo}>
                      <strong>{l.name}</strong>
                      <span className={styles.muted}>{rupees(l.price)} each</span>
                      <button type="button" className={styles.linkBtn} onClick={() => removeLine(l.id)}>
                        Remove
                      </button>
                    </div>
                    <div className={styles.lineSide}>
                      <div className={styles.qty}>
                        <button type="button" onClick={() => changeQty(l.id, -1)} aria-label={`Decrease ${l.name}`}>−</button>
                        <span className={styles.qtyValue}>{l.qty}</span>
                        <button type="button" onClick={() => changeQty(l.id, 1)} aria-label={`Increase ${l.name}`}>+</button>
                      </div>
                      <div className={styles.lineTotal}>{rupees(l.price * l.qty)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        </div>

        <aside className={styles.side}>
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Offers</h3>
            <div className={styles.codeRow}>
              <input
                className={styles.codeInput}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="ENTER CODE"
                maxLength={14}
              />
              <button type="button" className={styles.applyBtn} onClick={() => applyCoupon(codeInput)}>
                Apply
              </button>
            </div>
            {coupon && (
              <div className={styles.applied}>
                <span>{coupon} applied</span>
                <button type="button" className={styles.linkBtn} onClick={removeCoupon}>Remove</button>
              </div>
            )}
            {couponMsg && <p className={styles.error}>{couponMsg}</p>}
            <div className={styles.chips}>
              {OFFER_CODES.map((c) => (
                <button key={c} type="button" className={styles.chip} onClick={() => applyCoupon(c)}>
                  {c}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Bill summary</h3>
            {quoteError && <p className={styles.error}>{quoteError}</p>}
            {!quote && !quoteError && <p className={styles.muted}>Calculating…</p>}
            {quote && (
              <>
                <div className={styles.billRow}>
                  <span>Item total</span>
                  <span className={styles.billValue}>{rupees(quote.subtotal)}</span>
                </div>
                {quote.discount > 0 && (
                  <div className={styles.billRow}>
                    <span className={styles.discount}>Coupon {quote.couponApplied}</span>
                    <span className={styles.discount}>−{rupees(quote.discount)}</span>
                  </div>
                )}
                <div className={styles.billRow}>
                  <span>Delivery fee</span>
                  <span className={styles.billValue}>{quote.fee === 0 ? 'Free' : rupees(quote.fee)}</span>
                </div>
                {typeof quote.tax === 'number' && (
                  <div className={styles.billRow}>
                    <span>Taxes and charges</span>
                    <span className={styles.billValue}>{rupees(quote.tax)}</span>
                  </div>
                )}
                <div className={styles.billTotal}>
                  <span>To pay</span>
                  <span>{rupees(quote.total)}</span>
                </div>
              </>
            )}
            <Link href="/checkout" className={styles.placeBtn}>
              {quote ? `Proceed to checkout · ${rupees(quote.total)}` : 'Proceed to checkout'}
            </Link>
          </section>
        </aside>
      </div></main><Footer /></>
  );
}




