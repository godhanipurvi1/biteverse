"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAdminOffers, getAdminOrders, inr } from "./admin.api";
import styles from "./admin-dashboard.module.css";

type Row = {
  _id: string;
  status: string;
  totalInr: number;
  mode: string;
  createdAt: string;
  userId?: { name?: string } | null;
  restaurantName?: string;
};

type Offer = { _id: string; code: string; title: string; active: boolean };

const GROUPS = [
  { key: "pending", label: "Pending", color: "#f59e0b", match: ["placed", "accepted"] },
  { key: "preparing", label: "Preparing", color: "#fb923c", match: ["preparing"] },
  { key: "out", label: "Out for delivery", color: "#3b82f6", match: ["out-for-delivery"] },
  { key: "delivered", label: "Delivered", color: "#16a34a", match: ["delivered"] },
  { key: "cancelled", label: "Cancelled", color: "#dc2626", match: ["cancelled"] },
];

const STATUS_LABEL: Record<string, string> = {
  placed: "Pending",
  accepted: "Pending",
  preparing: "Preparing",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const badgeClass = (status: string) => {
  if (status === "delivered") return styles.ok;
  if (status === "cancelled") return styles.bad;
  if (status === "out-for-delivery") return styles.info;
  return styles.warn;
};

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const today = () =>
  new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export function AdminDashboard() {
  const [orders, setOrders] = useState<Row[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [o, f] = await Promise.all([getAdminOrders(), getAdminOffers()]);
        if (!alive) return;
        setOrders(o.orders as unknown as Row[]);
        setOffers(f.offers as unknown as Offer[]);
        setError("");
      } catch (e) {
        console.error("Admin dashboard load failed:", e);
        if (alive) setError("Could not load the dashboard.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== "cancelled");
    return {
      total: orders.length,
      revenue: live.reduce((sum, o) => sum + o.totalInr, 0),
      active: orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length,
      customers: new Set(orders.map((o) => o.userId?.name ?? o._id)).size,
    };
  }, [orders]);

  const groups = useMemo(
    () => GROUPS.map((g) => ({ ...g, count: orders.filter((o) => g.match.includes(o.status)).length })),
    [orders]
  );

  const days = useMemo(() => {
    const out: { label: string; key: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      out.push({
        label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        key: d.toDateString(),
        total: 0,
      });
    }
    orders.forEach((o) => {
      if (o.status === "cancelled") return;
      const day = out.find((x) => x.key === new Date(o.createdAt).toDateString());
      if (day) day.total += o.totalInr;
    });
    return out;
  }, [orders]);

  const maxDay = Math.max(1, ...days.map((d) => d.total));
  const recent = orders.slice(0, 6);
  const activeOffers = offers.filter((o) => o.active).length;

  const R = 60;
  const C = 2 * Math.PI * R;
  const totalForDonut = groups.reduce((s, g) => s + g.count, 0);

  if (error) return <div className={styles.state}>{error}</div>;

  return (
    <section>
      <div className={styles.welcome}>
        <div>
          <h1 className={styles.title}>Welcome back, Admin!</h1>
          <p className={styles.subtitle}>Here&apos;s what&apos;s happening with BiteVerse today.</p>
        </div>
        <span className={styles.dateChip}>{today()}</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statIcon}>#</div>
          <div>
            <p className={styles.statLabel}>Total orders</p>
            <p className={styles.statValue}>{loading ? "…" : stats.total.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statIcon}>₹</div>
          <div>
            <p className={styles.statLabel}>Total revenue</p>
            <p className={styles.statValue}>{loading ? "…" : inr(stats.revenue)}</p>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statIcon}>◷</div>
          <div>
            <p className={styles.statLabel}>Active orders</p>
            <p className={styles.statValue}>{loading ? "…" : stats.active}</p>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statIcon}>☺</div>
          <div>
            <p className={styles.statLabel}>Customers</p>
            <p className={styles.statValue}>{loading ? "…" : stats.customers.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Revenue, last 7 days</h2>
            <span className={styles.muted}>Excludes cancelled</span>
          </div>
          <div className={styles.bars}>
            {days.map((d) => (
              <div key={d.key} className={styles.barCol}>
                <span className={styles.barValue}>{d.total ? inr(d.total) : ""}</span>
                <div
                  className={styles.bar}
                  style={{ height: `${Math.max(3, (d.total / maxDay) * 100)}%` }}
                  title={`${d.label}: ${inr(d.total)}`}
                />
                <span className={styles.barLabel}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Order status</h2>
          </div>
          <div className={styles.donut}>
            <svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Order status breakdown">
              <g transform="rotate(-90 80 80)">
                <circle cx="80" cy="80" r={R} fill="none" stroke="#f3f4f6" strokeWidth="22" />
                {(() => {
                  let acc = 0;
                  return groups.map((g) => {
                    const len = totalForDonut ? (g.count / totalForDonut) * C : 0;
                    const el = (
                      <circle
                        key={g.key}
                        cx="80"
                        cy="80"
                        r={R}
                        fill="none"
                        stroke={g.color}
                        strokeWidth="22"
                        strokeDasharray={`${len} ${C - len}`}
                        strokeDashoffset={-acc}
                      />
                    );
                    acc += len;
                    return el;
                  });
                })()}
              </g>
              <text x="80" y="78" textAnchor="middle" fontSize="22" fontWeight="800" fill="#111827">
                {totalForDonut}
              </text>
              <text x="80" y="96" textAnchor="middle" fontSize="11" fill="#6b7280">
                Total orders
              </text>
            </svg>
            <div className={styles.legend}>
              {groups.map((g) => (
                <div key={g.key} className={styles.legendItem}>
                  <span className={styles.dot} style={{ background: g.color }} />
                  {g.label}
                  <span className={styles.legendCount}>{g.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Recent orders</h2>
            <Link href="/admin/orders" className={styles.link}>View all →</Link>
          </div>
          {!loading && recent.length === 0 && <p className={styles.muted}>No orders yet.</p>}
          {recent.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Time</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o._id}>
                    <td className={styles.orderId}>#{o._id.slice(-8).toUpperCase()}</td>
                    <td>{o.userId?.name ?? "Unknown"}</td>
                    <td>{o.restaurantName ?? "—"}</td>
                    <td>{timeOf(o.createdAt)}</td>
                    <td>{inr(o.totalInr)}</td>
                    <td>{o.mode === "pickup" ? "Pickup" : "Delivery"}</td>
                    <td>
                      <span className={`${styles.badge} ${badgeClass(o.status)}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Offers &amp; coupons</h2>
            <Link href="/admin/offers" className={styles.link}>Manage →</Link>
          </div>
          <p className={styles.muted} style={{ marginTop: 0 }}>
            {activeOffers} active of {offers.length}
          </p>
          {offers.length === 0 && <p className={styles.muted}>No coupons yet.</p>}
          {offers.slice(0, 5).map((o) => (
            <div key={o._id} className={styles.offer}>
              <div>
                <span className={styles.code}>{o.code}</span>
                <p className={styles.muted} style={{ margin: "0.3rem 0 0" }}>{o.title}</p>
              </div>
              <span className={`${styles.badge} ${o.active ? styles.ok : styles.warn}`}>
                {o.active ? "Active" : "Off"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}