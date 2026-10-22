'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './admin.module.css';
import ds from './dashboard.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
// Keep in sync with TOKEN_KEY in page.tsx.
const TOKEN_KEY = 'biteverse-token';

const STATUSES = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
const LABEL: Record<string, string> = {
  placed: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
const COLOR: Record<string, string> = {
  placed: 'var(--warn)',
  confirmed: 'var(--info)',
  preparing: '#6b8be0',
  ready: '#f0a36b',
  out_for_delivery: 'var(--brand)',
  delivered: 'var(--ok)',
  cancelled: 'var(--bad)',
};
const RANGES = ['7d', '30d', '90d', '1y'] as const;
type Range = (typeof RANGES)[number];
const RANGE_LABEL: Record<Range, string> = { '7d': '7D', '30d': '30D', '90d': '90D', '1y': '1Y' };
const WORDS = ['orders', 'dishes', 'deliveries'];

const ICONS: Record<string, string> = {
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6',
  rupee: 'M7 5h10M7 9h10M7 5c6 0 7 4 3 7l-3 2 7 5',
  bell: 'M6 17V11a6 6 0 1 1 12 0v6l2 2H4l2-2zM10 21h4',
  fork: 'M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 21V3c-2.5 1.5-3 5-3 8h3',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3.1-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 7M18 15c2.2.6 4 2.3 4 6',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3',
};

type Stats = {
  totalOrders: number;
  byStatus: Record<string, number>;
  todayOrders: number;
  todayRevenue: number;
  dishesTotal: number;
  dishesUnavailable: number;
};
type Customers = { total: number; newToday: number; active30d: number };
type Order = {
  _id: string;
  restaurantName: string;
  customer: { name: string; phone: string; address: string };
  items: { name: string; qty: number; price: number; lineTotal: number }[];
  total: number;
  status: string;
  createdAt: string;
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

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const shortId = (id: string) => `#${id.slice(-6).toUpperCase()}`;
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

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

function Swap() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return <span className={styles.swap}>{WORDS[i]}</span>;
}

function Empty({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className={ds.emptyBox}>
      <span className={ds.emptyIcon}><Icon name={icon} /></span>
      <span className={ds.emptyTitle}>{title}</span>
      <p className={ds.emptyText}>{text}</p>
    </div>
  );
}

function LineChart({ points }: { points: Trend[] }) {
  const W = 640;
  const H = 240;
  const PL = 8;
  const PR = 8;
  const PT = 16;
  const PB = 28;
  const iw = W - PL - PR;
  const ih = H - PT - PB;
  const max = Math.max(1, ...points.map((p) => p.revenue));
  const xs = points.map((_, i) => (points.length === 1 ? PL + iw / 2 : PL + (i * iw) / (points.length - 1)));
  const ys = points.map((p) => PT + ih - (p.revenue / max) * ih);
  const line = points.map((_, i) => `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const base = PT + ih;
  const area = `${line} L${xs[xs.length - 1].toFixed(1)},${base} L${xs[0].toFixed(1)},${base} Z`;
  const step = Math.max(1, Math.ceil(points.length / 7));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={ds.lineSvg} role="img" aria-label="Revenue trend">
      {[0, 0.5, 1].map((f) => {
        const y = PT + ih * f;
        return <line key={f} x1={PL} x2={W - PR} y1={y} y2={y} className={ds.gridLine} />;
      })}
      <path d={area} className={ds.area} />
      <path d={line} className={ds.line} />
      {points.map((p, i) => (
        <g key={p.key}>
          <circle cx={xs[i]} cy={ys[i]} r={4.5} className={ds.dot}>
            <title>{`${p.label}: ${inr(p.revenue)} · ${p.orders} orders`}</title>
          </circle>
          {(i % step === 0 || i === points.length - 1) && (
            <text x={xs[i]} y={H - 6} textAnchor="middle" className={ds.axis}>{p.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

export function Dashboard({
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
  const [range, setRange] = useState<Range>('7d');
  const [trend, setTrend] = useState<Trend[] | null>(null);
  const [sellers, setSellers] = useState<TopDish[] | null>(null);
  const [recent, setRecent] = useState<Order[] | null>(null);
  const [customers, setCustomers] = useState<Customers | null>(null);
  const [error, setError] = useState('');

  const loadTrend = useCallback(async () => {
    try {
      const j = await api<{ data: Trend[] }>(`/api/admin/analytics/trends?range=${range}`);
      setTrend(j.data);
    } catch (e) {
      setError((e as Error).message);
      setTrend([]);
    }
  }, [range]);

  const loadRest = useCallback(async () => {
    try {
      const [s, r, c] = await Promise.all([
        api<{ data: TopDish[] }>('/api/admin/analytics/top-dishes?limit=5'),
        api<{ data: Order[] }>('/api/admin/orders'),
        api<{ data: Customers }>('/api/admin/analytics/customers'),
      ]);
      setSellers(s.data);
      setRecent(r.data.slice(0, 6));
      setCustomers(c.data);
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setSellers([]);
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    loadTrend();
    const t = setInterval(loadTrend, 60000);
    return () => clearInterval(t);
  }, [loadTrend]);

  useEffect(() => {
    loadRest();
    const t = setInterval(loadRest, 30000);
    return () => clearInterval(t);
  }, [loadRest]);

  const statusCounts = STATUSES.map((s) => ({ s, n: stats?.byStatus[s] ?? 0 }));
  const totalStatus = statusCounts.reduce((n, x) => n + x.n, 0);
  const pending = stats?.byStatus.placed ?? 0;
  const trendRevenue = (trend ?? []).reduce((n, p) => n + p.revenue, 0);
  const trendOrders = (trend ?? []).reduce((n, p) => n + p.orders, 0);
  const topQty = sellers?.[0]?.qty || 1;
  const available = stats ? stats.dishesTotal - stats.dishesUnavailable : 0;
  const hasTrend = trend !== null && trend.some((p) => p.revenue > 0);
  const skelInline = <span className={`${ds.shimmer} ${ds.skelInline}`} />;

  return (
    <div className={styles.view}>
      <section className={styles.hero}>
        <span className={styles.kicker}>Good Food • Better Mood</span>
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

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.stats}>
        <div className={styles.card}>
          <div className={styles.stat}>
            <span className={styles.statTop}><span className={styles.statIcon}><Icon name="receipt" /></span>Orders today</span>
            <span className={styles.statVal}>{stats ? stats.todayOrders : skelInline}</span>
            <span className={styles.statHint}>Placed since midnight</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.stat}>
            <span className={styles.statTop}><span className={styles.statIcon}><Icon name="rupee" /></span>Revenue today</span>
            <span className={styles.statVal}>{stats ? inr(stats.todayRevenue) : skelInline}</span>
            <span className={styles.statHint}>Excludes cancelled orders</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.stat}>
            <span className={styles.statTop}><span className={styles.statIcon}><Icon name="users" /></span>Active customers</span>
            <span className={styles.statVal}>{customers ? customers.active30d : skelInline}</span>
            <span className={styles.statHint}>
              {customers ? `ordered in 30 days · ${customers.total} registered, ${customers.newToday} new today` : ''}
            </span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.stat}>
            <span className={styles.statTop}><span className={styles.statIcon}><Icon name="bell" /></span>Waiting to confirm</span>
            <span className={styles.statVal}>{stats ? pending : skelInline}</span>
            <span className={styles.statHint}>{pending ? 'Confirm them to keep customers happy' : 'All caught up'}</span>
          </div>
        </div>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h2 className={styles.h2}>Order trends</h2>
            <p className={styles.sub}>
              {trend === null ? 'Loading…' : `${inr(trendRevenue)} from ${trendOrders} orders in this period`}
            </p>
          </div>
          <div className={styles.seg} role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}>
                {RANGE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        {trend === null ? (
          <div className={`${ds.shimmer} ${ds.skelChart}`} />
        ) : !hasTrend ? (
          <Empty icon="chart" title="No sales in this period" text="Revenue appears here once orders are placed." />
        ) : (
          <LineChart points={trend} />
        )}
      </section>

      <div className={styles.grid2}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.h2}>Order status</h2>
            <span className={styles.muted}>{totalStatus} orders</span>
          </div>
          {stats === null ? (
            <div className={`${ds.shimmer} ${ds.skelRow}`} />
          ) : totalStatus === 0 ? (
            <Empty icon="receipt" title="No orders yet" text="Status counts appear once customers place orders." />
          ) : (
            <>
              <div className={styles.statusBar}>
                {statusCounts.filter((x) => x.n > 0).map((x) => (
                  <i key={x.s} style={{ width: `${(x.n / totalStatus) * 100}%`, background: COLOR[x.s] }} title={`${LABEL[x.s]}: ${x.n}`} />
                ))}
              </div>
              <ul className={styles.legend}>
                {statusCounts.map((x) => (
                  <li key={x.s}>
                    <span className={styles.sw} style={{ background: COLOR[x.s] }} />
                    {LABEL[x.s]}
                    <span className={styles.legendN}>{x.n}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.h2}>Top dishes</h2>
          </div>
          {sellers === null ? (
            <>
              <div className={`${ds.shimmer} ${ds.skelRow}`} />
              <div className={`${ds.shimmer} ${ds.skelRow}`} />
            </>
          ) : sellers.length === 0 ? (
            <Empty icon="fork" title="No sales yet" text="Your best sellers show here after the first order." />
          ) : (
            <ul className={styles.sellers}>
              {sellers.map((s, i) => (
                <li key={s.name}>
                  <div className={styles.sellerTop}>
                    <span className={ds.sellerName}>
                      <span className={ds.rank}>{i + 1}</span>
                      {s.name}
                    </span>
                    <span className={styles.num}>{s.qty} sold</span>
                  </div>
                  <div className={styles.sellerBar}>
                    <i style={{ width: `${(s.qty / topQty) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.h2}>Quick actions</h2>
        </div>
        <div className={ds.quickGrid}>
          <button type="button" className={ds.quick} onClick={onOpenOrders}>
            <span className={ds.quickIcon}><Icon name="bell" /></span>
            <span className={ds.quickText}>
              <strong>Confirm pending orders</strong>
              <span>{pending} waiting</span>
            </span>
          </button>
          <button type="button" className={ds.quick} onClick={onOpenMenu}>
            <span className={ds.quickIcon}><Icon name="fork" /></span>
            <span className={ds.quickText}>
              <strong>Manage food items</strong>
              <span>{stats ? `${available} of ${stats.dishesTotal} dishes available` : 'Switch dishes on or off'}</span>
            </span>
          </button>
          <button type="button" className={ds.quick} onClick={onOpenOrders}>
            <span className={ds.quickIcon}><Icon name="receipt" /></span>
            <span className={ds.quickText}>
              <strong>View all orders</strong>
              <span>Search and filter by status</span>
            </span>
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.h2}>Recent orders</h2>
          <button type="button" className={styles.btn} onClick={onOpenOrders}>View all</button>
        </div>
        {recent === null ? (
          <>
            <div className={`${ds.shimmer} ${ds.skelRow}`} />
            <div className={`${ds.shimmer} ${ds.skelRow}`} />
            <div className={`${ds.shimmer} ${ds.skelRow}`} />
          </>
        ) : recent.length === 0 ? (
          <Empty icon="receipt" title="No orders yet" text="New orders from customers will appear here." />
        ) : (
          <div className={styles.tw}>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Items</th>
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
                    <td className={styles.num}>{o.items.reduce((n, i) => n + i.qty, 0)} items</td>
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
