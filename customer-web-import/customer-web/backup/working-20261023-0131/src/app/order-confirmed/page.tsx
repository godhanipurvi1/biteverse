'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './order-confirmed.module.css';

const ORDER_KEY = 'biteverse-last-order';

type SavedItem = { id: string; name: string; price: number; qty: number; restaurantName: string };
type SavedOrder = {
  orderId: string;
  total: number;
  method: 'upi' | 'card' | 'cod';
  address: 'home' | 'work';
  instruction: string;
  coupon: string | null;
  restaurants: string[];
  items: SavedItem[];
  createdAt: string;
};

const METHOD_LABEL: Record<SavedOrder['method'], string> = {
  upi: 'UPI',
  card: 'Credit or debit card',
  cod: 'Cash on delivery',
};

const rupees = (n: number) => `₹${Math.round(n)}`;

function readOrder(): SavedOrder | null {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    return raw ? (JSON.parse(raw) as SavedOrder) : null;
  } catch {
    return null;
  }
}

export default function OrderConfirmedPage() {
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOrder(readOrder());
    setLoaded(true);
  }, []);

  const time = order
    ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <Link href="/" className={styles.brand}>BiteVerse</Link>
        <Link href="/" className={styles.back}>Restaurants</Link>
      </div>

      <ol className={styles.steps}>
        <li><span>✓</span> Cart</li>
        <li><span>✓</span> Address and payment</li>
        <li className={styles.stepActive}><span>3</span> Confirmed</li>
      </ol>

      {!loaded ? (
        <div className={styles.empty}>Loading your order…</div>
      ) : !order ? (
        <div className={styles.empty}>
          <h2>No recent order found</h2>
          <p>Your order may have already been shown, or it was not placed from this browser.</p>
          <Link href="/" className={styles.primaryBtn}>Back to home</Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <section>
            <div className={styles.hero}>
              <div className={styles.tick}>✓</div>
              <div>
                <h1>Order placed</h1>
                <p className={styles.sub}>
                  {order.restaurants.join(', ')} has received your order and is preparing it now. A rider will be assigned shortly.
                </p>
              </div>
              <div className={styles.orderNo}>
                <small>Order number</small>
                <strong>#{order.orderId}</strong>
              </div>
            </div>

            <div className={styles.card}>
              <h3>What happens next</h3>
              <div className={styles.timeline}>
                <div className={styles.tDone}>
                  <span className={styles.dot}>✓</span>
                  <div>
                    <strong>Order received</strong>
                    <small>Placed at {time}</small>
                  </div>
                </div>
                <div className={styles.tNow}>
                  <span className={styles.dot} />
                  <div>
                    <strong>Preparing at {order.restaurants[0] ?? 'the restaurant'}</strong>
                    <small>About 15 minutes</small>
                  </div>
                </div>
                <div className={styles.tTodo}>
                  <span className={styles.dot} />
                  <div>
                    <strong>Out for delivery</strong>
                    <small>A rider will pick up your order</small>
                  </div>
                </div>
                <div className={styles.tTodo}>
                  <span className={styles.dot} />
                  <div>
                    <strong>Delivered</strong>
                    <small>Estimated 35 to 45 minutes from now</small>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3>Delivery and payment</h3>
              <div className={styles.grid2}>
                <div className={styles.tile}>
                  <small>Delivering to</small>
                  <strong>{order.address === 'home' ? 'Home' : 'Work'}</strong>
                </div>
                <div className={styles.tile}>
                  <small>Instructions</small>
                  <strong>{order.instruction}</strong>
                </div>
                <div className={styles.tile}>
                  <small>Payment</small>
                  <strong>{METHOD_LABEL[order.method]}</strong>
                </div>
                <div className={styles.tile}>
                  <small>Status</small>
                  <strong>{order.method === 'cod' ? `To pay ${rupees(order.total)}` : `Paid ${rupees(order.total)}`}</strong>
                </div>
              </div>
            </div>
          </section>

          <aside className={styles.summary}>
            <h3>Order summary</h3>
            {order.items.map((l) => (
              <div key={l.id} className={styles.row}>
                <span>{l.name} × {l.qty}</span>
                <span>{rupees(l.price * l.qty)}</span>
              </div>
            ))}
            {order.coupon && (
              <div className={`${styles.row} ${styles.green}`}>
                <span>Coupon {order.coupon}</span>
                <span>applied</span>
              </div>
            )}
            <div className={styles.toPay}>
              <span>Total paid</span>
              <span>{rupees(order.total)}</span>
            </div>
            <p className={styles.note}>
              {order.method === 'cod' ? 'Pay in cash when your order arrives.' : 'Receipt will be sent to your registered email.'}
            </p>
            <div className={styles.actions}>
              <Link href="/" className={styles.ghostBtn}>Back to home</Link>
              <Link href="/#tracking" className={styles.primaryBtn}>Track order</Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
