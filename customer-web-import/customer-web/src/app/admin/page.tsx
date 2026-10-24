'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './admin.module.css';
import MenuView from './MenuView';
import OffersView from './OffersView';
import CustomersView from './CustomersView';
import PaymentsView from './PaymentsView';
import DeliveryView from './DeliveryView';
import AnalyticsView from './AnalyticsView';
import ReviewsView from './ReviewsView';
import ProfileView from './ProfileView';
import { Dashboard as FullDashboard } from './Dashboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
// ASSUMPTION: the customer login stores its token under this key.
const TOKEN_KEY = 'biteverse-token';
const THEME_KEY = 'biteverse-admin-theme';

type View = 'dashboard' | 'orders' | 'menu' | 'offers' | 'customers' | 'payments' | 'delivery' | 'analytics' | 'reviews' | 'profile';
type Theme = 'light' | 'dark';
type OrdersInit = { q: string; status: string };

// Backend status names (apps/api order.state.ts) mapped to the admin's labels.
const BACKEND_FLOW = ['received', 'accepted', 'preparing', 'out-for-delivery', 'delivered'];
const FLOW = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
const TO_BACKEND: Record<string, string> = { placed: 'received', confirmed: 'accepted', preparing: 'preparing', ready: 'preparing', out_for_delivery: 'out-for-delivery', delivered: 'delivered' };
const LABEL: Record<string, string> = {
  placed: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
const STATUSES = [...FLOW, 'cancelled'];
const FILTERS = ['all', ...STATUSES];
const COLOR: Record<string, string> = {
  placed: 'var(--warn)',
  confirmed: 'var(--info)',
  preparing: '#6b8be0',
  ready: '#f0a36b',
  out_for_delivery: 'var(--brand)',
  delivered: 'var(--ok)',
  cancelled: 'var(--bad)',
};
const RANGES = ['7d', '30d', '90d', '1y'];
const RANGE_LABEL: Record<string, string> = { '7d': '7D', '30d': '30D', '90d': '90D', '1y': '1Y' };
const WORDS = ['orders', 'offers', 'dishes', 'deliveries'];
const PAY: Record<string, string> = { upi: 'UPI', card: 'Card', cod: 'Cash' };
const CANCEL_REASONS = ['Customer requested', 'Item unavailable', 'Restaurant closed', 'Payment failed', 'Delivery not possible'];

const ICONS: Record<string, string> = {
  grid: 'M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6',
  fork: 'M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 21V3c-2.5 1.5-3 5-3 8h3',
  tag: 'M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3.1-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 7M18 15c2.2.6 4 2.3 4 6',
  card: 'M3 6h18v12H3zM3 10h18M7 15h3',
  bike: 'M5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 15l3-6h4l4 6M11 9L9.5 6H7',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  menu: 'M4 6h16M4 12h16M4 18h16',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2-4.5-4.4 6.2-.9L12 3z',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0',
  bell: 'M6 17V11a6 6 0 1 1 12 0v6l2 2H4l2-2zM10 21h4',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  rupee: 'M7 5h10M7 9h10M7 5c6 0 7 4 3 7l-3 2 7 5',
  dl: 'M12 4v11M7 11l5 5 5-5M5 20h14',
};

const inr = (n: number) => `â‚¹${Math.round(n).toLocaleString('en-IN')}`;
const shortId = (id: string) => `#${id.slice(-6).toUpperCase()}`;
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

type Item = { name: string; qty: number; price: number; lineTotal: number };
type Order = {
  _id: string;
  restaurantName: string;
  customer: { name: string; phone: string; address: string };
  items: Item[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  payment: string;
  status: string;
  couponCode: string | null;
  createdAt: string;
  statusHistory: { status: string; at: string }[];
  cancelReason?: string;
};
type Stats = {
  totalOrders: number;
  byStatus: Record<string, number>;
  todayOrders: number;
  todayRevenue: number;
  dishesTotal: number;
  dishesUnavailable: number;
};
type Trend = { key: string; label: string; revenue: number; orders: number };
type TopDish = { name: string; qty: number; revenue: number };

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY) ?? '';
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
  return json as T;
}

function Icon({ name }: { name: string }) {
  return (
    <svg className={styles.ic} viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function Badge({ status }: { status: string }) {
  return <span className={`${styles.badge} ${styles[`b_${status}`] ?? ''}`}>{LABEL[status] ?? status}</span>;
}

function Soon({ icon, label }: { icon: string; label: string }) {
  return (
    <span className={`${styles.navItem} ${styles.navOff}`}>
      <Icon name={icon} />
      <span className={styles.lbl}>{label}</span>
      <span className={styles.soon}>Soon</span>
    </span>
  );
}

function Swap() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return <span className={styles.swap}>{WORDS[i]}</span>;
}

export default function AdminPage() {
  const [view, setView] = useState<View>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [toast, setToast] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState('');
  const [ordersInit, setOrdersInit] = useState<OrdersInit>({ q: '', status: 'all' });
  const [ordersKey, setOrdersKey] = useState(0);
  const [topQ, setTopQ] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const j = await api<{ data: Stats }>('/api/admin/stats');
      setStats(j.data);
      setStatsError('');
    } catch (e) {
      setStatsError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const t = setInterval(loadStats, 15000);
    return () => clearInterval(t);
  }, [loadStats]);

  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1);
      setView(h === 'orders' || h === 'menu' || h === 'offers' || h === 'customers' || h === 'payments' || h === 'delivery' || h === 'analytics' || h === 'reviews' || h === 'profile' ? h : 'dashboard');
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') setTheme(saved);
    else setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const go = (v: View) => {
    window.location.hash = v;
    setNavOpen(false);
  };
  const openOrders = (init: OrdersInit) => {
    setOrdersInit(init);
    setOrdersKey((k) => k + 1);
    go('orders');
  };
  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };
  const toggleMenu = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) setCollapsed((c) => !c);
    else setNavOpen((o) => !o);
  };

  const pending = stats?.byStatus.placed ?? 0;

  return (
    <div className={styles.app} data-theme={theme}>
      <header className={styles.topbar}>
        <button type="button" className={styles.iconBtn} onClick={toggleMenu} aria-label="Toggle menu">
          <Icon name="menu" />
        </button>
        <span className={styles.logo}>Bite<b>Verse</b></span>
        <span className={styles.tag}>Admin</span>
        <form
          className={styles.topSearch}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            openOrders({ q: topQ.trim(), status: 'all' });
          }}
        >
          <Icon name="search" />
          <label htmlFor="topq" hidden>Search orders</label>
          <input
            id="topq"
            type="search"
            placeholder="Search order ID or customer"
            value={topQ}
            onChange={(e) => setTopQ(e.target.value)}
            autoComplete="off"
          />
        </form>
        <span className={styles.spacer} />
        <button type="button" className={styles.iconBtn} onClick={toggleTheme} aria-label="Switch theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button type="button" className={styles.iconBtn} onClick={() => openOrders({ q: '', status: 'placed' })} aria-label="Pending orders">
          <Icon name="bell" />
          {pending > 0 && <span className={styles.dotb} />}
        </button>
        <span className={styles.userBtn}>
          <span className={styles.avatar}>A</span>
          <span className={styles.nm}>Admin</span>
        </span>
        <button type="button" className={styles.btn} onClick={() => { localStorage.removeItem(TOKEN_KEY); window.location.reload(); }}>Log out</button>
      </header>

      <div className={`${styles.shell} ${collapsed ? styles.collapsed : ''}`}>
        <aside className={`${styles.side} ${navOpen ? styles.sideOpen : ''}`} aria-label="Admin navigation">
          <div className={styles.sideHead}>
            <span className={styles.logo}>Bite<b>Verse</b></span>
            <button type="button" className={styles.iconBtn} onClick={() => setNavOpen(false)} aria-label="Close menu">
              <Icon name="close" />
            </button>
          </div>

          <div className={styles.navTitle}>Overview</div>
          <nav className={styles.nav}>
            <button type="button" className={`${styles.navItem} ${view === 'dashboard' ? styles.navOn : ''}`} onClick={() => go('dashboard')}>
              <Icon name="grid" />
              <span className={styles.lbl}>Dashboard</span>
            </button>
          </nav>

          <div className={styles.navTitle}>Management</div>
          <nav className={styles.nav}>
            <button type="button" className={`${styles.navItem} ${view === 'orders' ? styles.navOn : ''}`} onClick={() => openOrders({ q: '', status: 'all' })}>
              <Icon name="receipt" />
              <span className={styles.lbl}>Orders</span>
              {pending > 0 && <span className={styles.pill}>{pending}</span>}
            </button>
            <button type="button" className={`${styles.navItem} ${view === 'menu' ? styles.navOn : ''}`} onClick={() => go('menu')}>
              <Icon name="fork" />
              <span className={styles.lbl}>Food items</span>
            </button>
            <button type="button" className={`${styles.navItem} ${view === 'offers' ? styles.navOn : ''}`} onClick={() => go('offers')}>
              <Icon name="tag" />
              <span className={styles.lbl}>Offers and coupons</span>
            </button>
            <button type="button" className={`${styles.navItem} ${view === 'customers' ? styles.navOn : ''}`} onClick={() => go('customers')}>
  <Icon name="users" />
              <span className={styles.lbl}>Customers</span>
</button>
            <button type="button" className={`${styles.navItem} ${view === 'payments' ? styles.navOn : ''}`} onClick={() => go('payments')}>
  <Icon name="card" />
  <span className={styles.lbl}>Payments</span>
</button>
            <button type="button" className={`${styles.navItem} ${view === 'delivery' ? styles.navOn : ''}`} onClick={() => go('delivery')}>
  <Icon name="bike" />
  <span className={styles.lbl}>Delivery</span>
</button>
          </nav>

          <div className={styles.navTitle}>System</div>
          <nav className={styles.nav}>
            <button type="button" className={`${styles.navItem} ${view === 'analytics' ? styles.navOn : ''}`} onClick={() => go('analytics')}>
  <Icon name="chart" />
  <span className={styles.lbl}>Analytics</span>
</button>
            <button type="button" className={`${styles.navItem} ${view === 'reviews' ? styles.navOn : ''}`} onClick={() => go('reviews')}>
  <Icon name="star" />
  <span className={styles.lbl}>Reviews</span>
</button>
            <button type="button" className={`${styles.navItem} ${view === 'profile' ? styles.navOn : ''}`} onClick={() => go('profile')}>
  <Icon name="user" />
  <span className={styles.lbl}>My profile</span>
</button>
          </nav>

          <div className={styles.promo}>
            <p>{pending ? `${pending} ${pending === 1 ? 'order is' : 'orders are'} waiting for you.` : 'All caught up. New orders will show here.'}</p>
            <button type="button" className={styles.promoBtn} onClick={() => openOrders({ q: '', status: 'all' })}>Open orders</button>
            <span className={styles.promoRing} aria-hidden="true" />
          </div>
        </aside>
        <div className={`${styles.scrim} ${navOpen ? styles.scrimOn : ''}`} onClick={() => setNavOpen(false)} />

        <main className={styles.main}>
          {statsError && <div className={styles.error}>{statsError}</div>}
          {view === 'payments' ? <PaymentsView /> : view === 'profile' ? <ProfileView /> : view === 'reviews' ? <ReviewsView /> : view === 'analytics' ? <AnalyticsView /> : view === 'delivery' ? <DeliveryView /> : view === 'customers' ? <CustomersView /> : view === 'offers' ? (
            <OffersView onToast={setToast} />
          ) : view === 'menu' ? (
            <MenuView onToast={setToast} />
          ) : view === 'orders' ? (
            <OrdersView key={ordersKey} init={ordersInit} stats={stats} onToast={setToast} onChanged={loadStats} />
          ) : (
            <FullDashboard stats={stats} onOpenOrders={() => openOrders({ q: '', status: 'all' })} onOpenMenu={() => go('menu')} onOpenOrder={() => openOrders({ q: '', status: 'all' })} />
          )}
        </main>
      </div>

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  );
}

function TrendChart({ points }: { points: Trend[] }) {
  const w = 600;
  const h = 200;
  const gap = 6;
  const max = Math.max(1, ...points.map((p) => p.revenue));
  const bw = (w - gap * (points.length - 1)) / points.length;
  const step = Math.max(1, Math.ceil(points.length / 8));
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} className={styles.chart} role="img" aria-label="Revenue by period">
      {points.map((p, i) => {
        const bh = (p.revenue / max) * h;
        const x = i * (bw + gap);
        const showLabel = i % step === 0 || i === points.length - 1;
        return (
          <g key={p.key}>
            <rect x={x} y={h - bh} width={bw} height={Math.max(bh, 2)} rx={4} className={styles.bar}>
              <title>{`${p.label}: ${inr(p.revenue)} Ã‚Â· ${p.orders} orders`}</title>
            </rect>
            {showLabel && (
              <text x={x + bw / 2} y={h + 18} textAnchor="middle" className={styles.axis}>{p.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Dashboard({
  stats,
  onOpenOrders,
  onOpenMenu,
  onOpenOrder,
}: {
  stats: Stats | null;
  onOpenOrders: () => void;
  onOpenMenu: () => void;
  onOpenOrder: () => void;
}) {
  const [range, setRange] = useState('7d');
  const [trend, setTrend] = useState<Trend[]>([]);
  const [sellers, setSellers] = useState<TopDish[]>([]);
  const [recent, setRecent] = useState<Order[]>([]);

  useEffect(() => {
    api<{ data: Trend[] }>(`/api/admin/analytics/trends?range=${range}`)
      .then((j) => setTrend(j.data))
      .catch(() => setTrend([]));
  }, [range]);

  useEffect(() => {
    api<{ data: TopDish[] }>('/api/admin/analytics/top-dishes?limit=5')
      .then((j) => setSellers(j.data))
      .catch(() => setSellers([]));
    api<{ data: Order[] }>('/api/admin/orders')
      .then((j) => setRecent(j.data.slice(0, 6)))
      .catch(() => setRecent([]));
  }, []);

  const total = stats?.totalOrders ?? 0;
  const trendTotal = trend.reduce((n, p) => n + p.revenue, 0);
  const topSold = sellers[0]?.qty || 1;

  return (
    <div className={styles.view}>
      <section className={styles.hero}>
        <span className={styles.kicker}>Good Food Ã¢â‚¬Â¢ Better Mood</span>
        <h1 className={styles.heroTitle}>
          Run BiteVerse,
          <span>all in one place</span>
        </h1>
        <p className={styles.heroLede}>
          Here is what is happening today. Confirm new orders, keep the menu fresh and manage <Swap /> in a few taps.
        </p>
        <div className={styles.heroAct}>
          <button type="button" className={`${styles.btn} ${styles.btnPri}`} onClick={onOpenOrders}>
            <Icon name="receipt" /> Manage orders
          </button>
          <button type="button" className={styles.btn} onClick={onOpenMenu}>
            <Icon name="fork" /> Manage menu
          </button>
        </div>
      </section>

      <div className={styles.stats}>
        <div className={styles.card}>
          <div className={styles.stat}>
            <span className={styles.statTop}><span className={styles.statIcon}><Icon name="receipt" /></span>Orders today</span>
            <span className={styles.statVal}>{stats ? stats.todayOrders : 'Ã¢â‚¬â€œ'}</span>
            <span className={styles.statHint}>Placed since midnight</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.stat}>
            <span className={styles.statTop}><span className={styles.statIcon}><Icon name="rupee" /></span>Revenue today</span>
            <span className={styles.statVal}>{stats ? inr(stats.todayRevenue) : 'Ã¢â‚¬â€œ'}</span>
            <span className={styles.statHint}>Excludes cancelled orders</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.stat}>
            <span className={styles.statTop}><span className={styles.statIcon}><Icon name="bell" /></span>Waiting to confirm</span>
            <span className={styles.statVal}>{stats ? stats.byStatus.placed ?? 0 : 'Ã¢â‚¬â€œ'}</span>
            <span className={styles.statHint}>New orders from customers</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.stat}>
            <span className={styles.statTop}><span className={styles.statIcon}><Icon name="fork" /></span>Dishes available</span>
            <span className={styles.statVal}>{stats ? stats.dishesTotal - stats.dishesUnavailable : 'Ã¢â‚¬â€œ'}</span>
            <span className={styles.statHint}>{stats ? `of ${stats.dishesTotal} dishes` : ''}</span>
          </div>
        </div>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h2 className={styles.h2}>Order trends</h2>
            <p className={styles.sub}>Revenue of {inr(trendTotal)} in this period</p>
          </div>
          <div className={styles.seg} role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}>
                {RANGE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        {trend.length === 0 ? <div className={styles.empty}>No sales in this period yet.</div> : <TrendChart points={trend} />}
      </section>

      <div className={styles.grid2}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.h2}>Order status</h2>
            <span className={styles.muted}>{total} orders</span>
          </div>
          <div className={styles.statusBar}>
            {STATUSES.map((s) => {
              const n = stats?.byStatus[s] ?? 0;
              return n ? <i key={s} style={{ width: `${(n / total) * 100}%`, background: COLOR[s] }} title={`${LABEL[s]}: ${n}`} /> : null;
            })}
          </div>
          <ul className={styles.legend}>
            {STATUSES.map((s) => (
              <li key={s}>
                <span className={styles.sw} style={{ background: COLOR[s] }} />
                {LABEL[s]}
                <span className={styles.legendN}>{stats?.byStatus[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.h2}>Top dishes</h2>
          </div>
          {sellers.length === 0 ? (
            <div className={styles.empty}>No sales yet.</div>
          ) : (
            <ul className={styles.sellers}>
              {sellers.map((s) => (
                <li key={s.name}>
                  <div className={styles.sellerTop}>
                    <span>{s.name}</span>
                    <span className={styles.num}>{s.qty} sold</span>
                  </div>
                  <div className={styles.sellerBar}>
                    <i style={{ width: `${(s.qty / topSold) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.h2}>Recent orders</h2>
          <button type="button" className={styles.btn} onClick={onOpenOrders}>View all</button>
        </div>
        {recent.length === 0 ? (
          <div className={styles.empty}>No orders yet.</div>
        ) : (
          <div className={styles.tw}>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o._id} className={styles.rowClick} onClick={onOpenOrder}>
                    <td className={styles.mono}>{shortId(o._id)}</td>
                    <td>{o.customer.name}</td>
                    <td>{o.restaurantName}</td>
                    <td className={styles.num}>{inr(o.total)}</td>
                    <td><Badge status={o.status} /></td>
                    <td className={styles.muted}>{when(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function OrdersView({
  init,
  stats,
  onToast,
  onChanged,
}: {
  init: OrdersInit;
  stats: Stats | null;
  onToast: (m: string) => void;
  onChanged: () => void;
}) {
  const [status, setStatus] = useState(init.status);
  const [q, setQ] = useState(init.q);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (q.trim()) params.set('q', q.trim());
    try {
      const j = await api<{ data: Order[] }>(`/api/admin/orders?${params.toString()}`);
      setOrders(j.data);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [status, q]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const open = orders.find((o) => o._id === openId) ?? null;
  const countOf = (f: string) => (f === 'all' ? stats?.totalOrders ?? 0 : stats?.byStatus[f] ?? 0);

  async function refreshAll() {
    await load();
    onChanged();
  }

  return (
    <div className={styles.view}>
      <div className={styles.pagehead}>
        <div>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.sub}>Confirm orders and move them along until delivered.</p>
        </div>
      </div>

      <div className={styles.chips}>
        {FILTERS.map((f) => (
          <button key={f} type="button" className={`${styles.chip} ${status === f ? styles.chipOn : ''}`} onClick={() => setStatus(f)}>
            {f === 'all' ? 'All' : LABEL[f]}
            <span className={styles.chipCount}>{countOf(f)}</span>
          </button>
        ))}
      </div>

      <input
        className={styles.search}
        type="search"
        placeholder="Search customer, phone or restaurant"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search orders"
      />

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card}>
        {orders.length === 0 && !error ? (
          <div className={styles.empty}>No orders match this filter.</div>
        ) : (
          <div className={styles.tw}>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className={styles.rowClick} onClick={() => setOpenId(o._id)}>
                    <td className={styles.mono}>{shortId(o._id)}</td>
                    <td>{o.customer.name}</td>
                    <td>{o.restaurantName}</td>
                    <td className={styles.num}>{inr(o.total)}</td>
                    <td><Badge status={o.status} /></td>
                    <td className={styles.muted}>{when(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && <Drawer order={open} onClose={() => setOpenId(null)} onChanged={refreshAll} onToast={onToast} />}
    </div>
  );
}

function Drawer({
  order,
  onClose,
  onChanged,
  onToast,
}: {
  order: Order;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onToast: (m: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [askCancel, setAskCancel] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);

  const idx = FLOW.indexOf(order.status);
  const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
  const canCancel = order.status !== 'delivered' && order.status !== 'cancelled';

  async function run(path: string, body: object, done: string) {
    setBusy(true);
    try {
      await api(path, { method: 'PATCH', body: JSON.stringify(body) });
      onToast(done);
      setAskCancel(false);
      await onChanged();
    } catch (e) {
      onToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer} aria-label="Order details">
        <div className={styles.dHead}>
          <div>
            <h2 className={styles.h2}>Order {shortId(order._id)}</h2>
            <p className={styles.sub}>{order.restaurantName} Ã‚Â· {when(order.createdAt)}</p>
          </div>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        <div><Badge status={order.status} /></div>
        {order.cancelReason && <p className={styles.muted}>Reason: {order.cancelReason}</p>}

        <section className={styles.section}>
          <h3 className={styles.h3}>Customer</h3>
          <div className={styles.kv}><span>Name</span><span>{order.customer.name}</span></div>
          <div className={styles.kv}><span>Phone</span><span className={styles.num}>{order.customer.phone}</span></div>
          <div className={styles.kv}><span>Address</span><span>{order.customer.address}</span></div>
          <div className={styles.kv}><span>Payment</span><span>{PAY[order.payment] ?? order.payment}</span></div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.h3}>Items</h3>
          {order.items.map((i, n) => (
            <div key={n} className={styles.kv}>
              <span>{i.name} Ãƒâ€” {i.qty}</span>
              <span className={styles.num}>{inr(i.lineTotal)}</span>
            </div>
          ))}
          <div className={styles.kv}><span>Subtotal</span><span className={styles.num}>{inr(order.subtotal)}</span></div>
          {order.discount > 0 && (
            <div className={styles.kv}>
              <span>Coupon {order.couponCode}</span>
              <span className={styles.num}>Ã¢Ë†â€™{inr(order.discount)}</span>
            </div>
          )}
          <div className={styles.kv}>
            <span>Delivery fee</span>
            <span className={styles.num}>{order.deliveryFee === 0 ? 'Free' : inr(order.deliveryFee)}</span>
          </div>
          <div className={`${styles.kv} ${styles.kvTotal}`}><span>Total</span><span className={styles.num}>{inr(order.total)}</span></div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.h3}>Status history</h3>
          <ol className={styles.timeline}>
            {order.statusHistory.map((h, n) => (
              <li key={n}>
                <strong>{LABEL[h.status] ?? h.status}</strong>
                <span className={styles.muted}>{when(h.at)}</span>
              </li>
            ))}
          </ol>
        </section>

          <div className={styles.section}>
            <h3 className={styles.h3}>Change status</h3>
            <select
              id="nextStatus"
              key={order._id + order.status}
              className={styles.select}
              defaultValue={FLOW.includes(order.status) ? order.status : 'placed'}
            >
              {FLOW.map((f) => (
                <option key={f} value={f}>{LABEL[f]}</option>
              ))}
            </select>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPri}`}
              disabled={busy}
              onClick={() => {
                const sel = (document.getElementById('nextStatus') as HTMLSelectElement).value;
                run(`/api/admin/orders/${order._id}/status`, { status: sel }, `Order ${shortId(order._id)} is now ${LABEL[sel].toLowerCase()}`);
              }}
            >
              Save status
            </button>
          </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={() => onToast('Receipts are not connected yet')}>
            <Icon name="dl" /> Receipt
          </button>
          {canCancel && !askCancel && (
            <button type="button" className={`${styles.btn} ${styles.btnDanger}`} disabled={busy} onClick={() => setAskCancel(true)}>
              Cancel order
            </button>
          )}
        </div>

        {askCancel && (
          <div className={styles.cancelBox}>
            <label className={styles.h3} htmlFor="creason">Reason for cancelling</label>
            <select id="creason" className={styles.select} value={reason} onChange={(e) => setReason(e.target.value)}>
              {CANCEL_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                disabled={busy}
                onClick={() => run(`/api/admin/orders/${order._id}/cancel`, { reason }, `Order ${shortId(order._id)} cancelled`)}
              >
                Confirm cancellation
              </button>
              <button type="button" className={styles.btn} onClick={() => setAskCancel(false)}>Keep order</button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}



