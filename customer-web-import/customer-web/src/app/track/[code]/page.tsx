'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import styles from '../../order-confirmed/order-confirmed.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const POLL_MS = 5000;

type TrackOrder = {
  id: string;
  restaurantName: string;
  items: { name: string; qty: number; price: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: string;
};

type Tracking = {
  trackingCode: string;
  createdAt: string;
  payment: string;
  couponCode: string | null;
  orders: TrackOrder[];
};

const rupees = (n: number) => `₹${Math.round(n)}`;

// What the customer is told when an admin moves an order to a new status.
const STATUS_TEXT: Record<string, string> = {
  placed: 'your order was placed',
  confirmed: 'the restaurant confirmed your order',
  preparing: 'the kitchen is preparing your food',
  ready: 'your food is ready and waiting for a rider',
  out_for_delivery: 'your rider picked up your order',
  delivered: 'your order was delivered. Enjoy your meal!',
  cancelled: 'your order was cancelled',
};

// Admin statuses mapped onto the four customer steps.
function stageOf(status: string) {
  if (status === 'preparing' || status === 'ready') return 1;
  if (status === 'out_for_delivery') return 2;
  if (status === 'delivered') return 3;
  return 0; // placed, confirmed
}

const PAYMENT_LABEL: Record<string, string> = { upi: 'UPI', card: 'Credit or debit card', cod: 'Cash on delivery' };

export default function TrackPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [data, setData] = useState<Tracking | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [notifPerm, setNotifPerm] = useState<string>('unsupported');

  // Last known status of each order, so we only notify on a real change.
  const seen = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    if (typeof Notification !== 'undefined') setNotifPerm(Notification.permission);
  }, []);

  // Hide the in-page alert after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('BiteVerse', { body: message });
      } catch {
        // some browsers block notifications outside a user gesture; the toast still shows
      }
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/track/${encodeURIComponent(code)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setData(null);
        setError(json.message || 'Order not found');
      } else {
        const tracking = json as Tracking;
        const current: Record<string, string> = {};
        for (const o of tracking.orders) current[o.id] = o.status;

        // Compare against the previous poll and announce any change.
        if (seen.current) {
          const messages: string[] = [];
          for (const o of tracking.orders) {
            const prev = seen.current[o.id];
            if (prev && prev !== o.status) {
              messages.push(`${o.restaurantName}: ${STATUS_TEXT[o.status] ?? o.status}`);
            }
          }
          if (messages.length) notify(messages.join(' · '));
        }
        seen.current = current;

        setData(tracking);
        setError('');
      }
    } catch {
      setError('Could not reach the server. Retrying…');
    }
    setLoaded(true);
  }, [code, notify]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function enableNotifications() {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
  }

  async function cancelOrder() {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setBusy(true);
    setNotice('');
    try {
      const res = await fetch(`${API_URL}/api/orders/track/${encodeURIComponent(code)}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by customer' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setNotice(json.message || 'Could not cancel the order');
      else {
        setNotice('Your order was cancelled.');
        await load();
      }
    } catch {
      setNotice('Could not reach the server.');
    }
    setBusy(false);
  }

  const orders = data?.orders ?? [];
  const active = orders.filter((o) => o.status !== 'cancelled');
  const cancelled = orders.length > 0 && active.length === 0;
  const stage = active.length ? Math.min(...active.map((o) => stageOf(o.status))) : 0;
  const canCancel = orders.length > 0 && orders.every((o) => o.status === 'placed' || o.status === 'confirmed');
  const subtotal = orders.reduce((n, o) => n + o.subtotal, 0);
  const discount = orders.reduce((n, o) => n + o.discount, 0);
  const fee = orders.reduce((n, o) => n + o.deliveryFee, 0);
  const total = orders.reduce((n, o) => n + o.total, 0);
  const restaurantNames = orders.map((o) => o.restaurantName).join(', ');
  const placedAt = data
    ? new Date(data.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  const steps = [
    { title: 'Order received', sub: placedAt ? `Placed at ${placedAt}` : '' },
    { title: `Preparing at ${restaurantNames || 'the restaurant'}`, sub: 'About 15 minutes' },
    { title: 'Out for delivery', sub: 'A rider will pick up your order' },
    { title: 'Delivered', sub: 'Estimated 35 to 45 minutes from now' },
  ];

  const heading = cancelled ? 'Order cancelled' : stage === 3 ? 'Order delivered' : 'Order placed';

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <Link href="/" className={styles.brand}>BiteVerse</Link>
        <Link href="/" className={styles.back}>Restaurants</Link>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ff7a3d',
            color: '#120f0d',
            padding: '12px 18px',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 14,
            maxWidth: '90vw',
            zIndex: 50,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {toast}
        </div>
      )}

      {!loaded ? (
        <div className={styles.empty}>Loading your order…</div>
      ) : !data ? (
        <div className={styles.empty}>
          <h2>Order not found</h2>
          <p>{error}</p>
          <Link href="/" className={styles.primaryBtn}>Back to home</Link>
        </div>
      ) : (
        <div className={styles.layout}>
          <section>
            <div className={styles.hero}>
              <div className={styles.tick}>{cancelled ? '✕' : '✓'}</div>
              <div>
                <h1>{heading}</h1>
                <p className={styles.sub}>
                  {cancelled
                    ? 'This order was cancelled and will not be prepared.'
                    : `${restaurantNames} ${stage === 0 ? 'has received your order' : 'is updating your order'}. Status refreshes automatically.`}
                </p>
              </div>
              <div className={styles.orderNo}>
                <small>Tracking code</small>
                <strong>{data.trackingCode}</strong>
              </div>
            </div>

            {!cancelled && (
              <div className={styles.card}>
                <h3>What happens next</h3>
                <div className={styles.timeline}>
                  {steps.map((s, i) => {
                    const cls = i < stage ? styles.tDone : i === stage ? styles.tNow : styles.tTodo;
                    return (
                      <div key={s.title} className={cls}>
                        <span className={styles.dot}>{i < stage ? '✓' : ''}</span>
                        <div>
                          <strong>{s.title}</strong>
                          <small>{s.sub}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.card}>
              <h3>Payment</h3>
              <div className={styles.grid2}>
                <div className={styles.tile}>
                  <small>Payment</small>
                  <strong>{PAYMENT_LABEL[data.payment] ?? data.payment}</strong>
                </div>
                <div className={styles.tile}>
                  <small>Status</small>
                  <strong>
                    {cancelled
                      ? 'Cancelled'
                      : data.payment === 'cod'
                        ? `To pay ${rupees(total)}`
                        : `Paid ${rupees(total)}`}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <aside className={styles.summary}>
            <h3>Order summary</h3>
            {orders.map((o) => (
              <div key={o.id}>
                {orders.length > 1 && <div className={styles.groupName}>{o.restaurantName}</div>}
                {o.items.map((i, idx) => (
                  <div key={`${o.id}-${idx}`} className={styles.row}>
                    <span>{i.name} × {i.qty}</span>
                    <span>{rupees(i.lineTotal)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className={styles.divider} />
            <div className={styles.row}><span>Item total</span><span>{rupees(subtotal)}</span></div>
            {discount > 0 && (
              <div className={`${styles.row} ${styles.green}`}>
                <span>Coupon {data.couponCode}</span><span>−{rupees(discount)}</span>
              </div>
            )}
            <div className={styles.row}><span>Delivery fee</span><span>{fee === 0 ? 'FREE' : rupees(fee)}</span></div>
            <div className={styles.toPay}>
              <span>Total</span>
              <span>{rupees(total)}</span>
            </div>

            {notifPerm === 'default' && (
              <button type="button" onClick={enableNotifications} className={styles.note} style={{ background: 'none', border: 'none', color: '#ff7a3d', cursor: 'pointer', width: '100%' }}>
                Turn on browser alerts for status updates
              </button>
            )}

            {notice && <p className={styles.note}>{notice}</p>}

            <div className={styles.actions}>
              <Link href="/" className={styles.ghostBtn}>Back to home</Link>
              {!cancelled && (
                <button
                  type="button"
                  onClick={cancelOrder}
                  disabled={busy || !canCancel}
                  className={styles.ghostBtn}
                  style={{
                    cursor: busy || !canCancel ? 'not-allowed' : 'pointer',
                    color: '#ff7070',
                    borderColor: '#5a2a2a',
                    background: 'none',
                    opacity: canCancel ? 1 : 0.5,
                  }}
                >
                  {busy ? 'Cancelling…' : 'Cancel order'}
                </button>
              )}
            </div>
            {!canCancel && !cancelled && (
              <p className={styles.note}>
                The restaurant has started preparing, so this order can no longer be cancelled.
              </p>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
