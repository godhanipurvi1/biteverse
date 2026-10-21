"use client";
import { useEffect, useMemo, useState } from "react";
import { getAdminOrders, inr } from "./admin.api";
import { api } from "@/lib/api/client";
import shared from "./admin-dashboard.module.css";
import styles from "./admin-orders.module.css";

type Row = {
  _id: string;
  status: string;
  totalInr: number;
  mode: "delivery" | "pickup";
  createdAt: string;
  userId?: { name?: string; phone?: string; email?: string } | null;
  restaurantName?: string;
  items?: { menuItemName: string; priceInr: number; quantity: number }[];
  address?: string;
  couponCode?: string;
  discountInr?: number;
};

const LABEL: Record<string, string> = {
  placed: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const TABS = [
  { key: "all", label: "All", match: null },
  { key: "pending", label: "Pending", match: ["placed", "accepted"] },
  { key: "preparing", label: "Preparing", match: ["preparing"] },
  { key: "out", label: "Out for delivery", match: ["out-for-delivery"] },
  { key: "delivered", label: "Delivered", match: ["delivered"] },
  { key: "cancelled", label: "Cancelled", match: ["cancelled"] },
] as const;

// Next status, skipping "out-for-delivery" for pickup orders
const nextStatus = (o: Row): string | null => {
  switch (o.status) {
    case "placed":
      return "accepted";
    case "accepted":
      return "preparing";
    case "preparing":
      return o.mode === "pickup" ? "delivered" : "out-for-delivery";
    case "out-for-delivery":
      return "delivered";
    default:
      return null;
  }
};

const badgeClass = (status: string) => {
  if (status === "delivered") return shared.ok;
  if (status === "cancelled") return shared.bad;
  if (status === "out-for-delivery") return shared.info;
  return shared.warn;
};

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const shortId = (id: string) => id.slice(-8).toUpperCase();

export function AdminOrders() {
  const [orders, setOrders] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "delivery" | "pickup">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = async () => {
    try {
      const data = await getAdminOrders();
      setOrders(data.orders as unknown as Row[]);
      setError("");
    } catch (e) {
      console.error("Admin orders load failed:", e);
      setError("Could not load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    TABS.forEach((t) => {
      c[t.key] = t.match
        ? orders.filter((o) => (t.match as readonly string[]).includes(o.status)).length
        : orders.length;
    });
    return c;
  }, [orders]);

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== "cancelled");
    return {
      total: orders.length,
      pending: counts.pending,
            preparing: (counts.preparing ?? 0) + (counts.out ?? 0),
      completed: counts.delivered,
      revenue: live.reduce((s, o) => s + o.totalInr, 0),
    };
  }, [orders, counts]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tabDef = TABS.find((t) => t.key === tab);
    return orders.filter((o) => {
      if (tabDef?.match && !(tabDef.match as readonly string[]).includes(o.status)) return false;
      if (modeFilter !== "all" && o.mode !== modeFilter) return false;
      if (q) {
        const hay = [
          shortId(o._id),
          o.userId?.name ?? "",
          o.userId?.phone ?? "",
          o.restaurantName ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, tab, search, modeFilter]);

  const selected = orders.find((o) => o._id === selectedId) ?? null;
  const next = selected ? nextStatus(selected) : null;

  const advance = async () => {
    if (!selected || !next) return;
    setBusy(true);
    setActionError("");
    try {
      await api(`/admin/orders/${selected._id}/status`, {
        method: "PATCH",
        body: { status: next },
      });
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not update the order.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className={shared.welcome}>
        <div>
          <h1 className={shared.title}>Order management</h1>
          <p className={shared.subtitle}>Manage and monitor all customer orders.</p>
        </div>
      </div>

      <div className={shared.stats}>
        <div className={shared.stat}>
          <div className={shared.statIcon}>#</div>
          <div>
            <p className={shared.statLabel}>Total orders</p>
            <p className={shared.statValue}>{loading ? "…" : stats.total}</p>
          </div>
        </div>
        <div className={shared.stat}>
          <div className={shared.statIcon}>◷</div>
          <div>
            <p className={shared.statLabel}>Pending</p>
            <p className={shared.statValue}>{loading ? "…" : stats.pending}</p>
          </div>
        </div>
        <div className={shared.stat}>
          <div className={shared.statIcon}>♨</div>
          <div>
            <p className={shared.statLabel}>In progress</p>
            <p className={shared.statValue}>{loading ? "…" : stats.preparing}</p>
          </div>
        </div>
        <div className={shared.stat}>
          <div className={shared.statIcon}>✓</div>
          <div>
            <p className={shared.statLabel}>Completed</p>
            <p className={shared.statValue}>{loading ? "…" : stats.completed}</p>
          </div>
        </div>
      </div>

      {error && <div className={shared.state} style={{ marginTop: "1rem" }}>{error}</div>}

      <div className={styles.layout}>
        <div className={shared.card}>
          <div className={styles.tabs}>
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label} ({counts[t.key] ?? 0})
              </button>
            ))}
          </div>

          <div className={styles.toolbar}>
            <input
              className={styles.search}
              type="search"
              placeholder="Search order ID, customer, phone, or restaurant"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={styles.select}
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as "all" | "delivery" | "pickup")}
            >
              <option value="all">All types</option>
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
          </div>

          {!loading && visible.length === 0 && (
            <p className={shared.muted}>No orders match these filters.</p>
          )}

          {visible.length > 0 && (
            <table className={shared.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Time</th>
                  <th>Total</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr
                    key={o._id}
                    className={o._id === selectedId ? styles.rowActive : undefined}
                  >
                    <td className={shared.orderId}>#{shortId(o._id)}</td>
                    <td>{o.userId?.name ?? "Unknown"}</td>
                    <td>{o.restaurantName ?? "—"}</td>
                    <td>{timeOf(o.createdAt)}</td>
                    <td>{inr(o.totalInr)}</td>
                    <td>{o.mode === "pickup" ? "Pickup" : "Delivery"}</td>
                    <td>
                      <span className={`${shared.badge} ${badgeClass(o.status)}`}>
                        {LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td>
                      <button className={styles.rowBtn} onClick={() => setSelectedId(o._id)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className={`${shared.card} ${styles.detail}`}>
          {!selected && <p className={shared.muted}>Select an order to see its details.</p>}

          {selected && (
            <>
              <div className={styles.detailHead}>
                <strong>#{shortId(selected._id)}</strong>
                <span className={`${shared.badge} ${badgeClass(selected.status)}`}>
                  {LABEL[selected.status] ?? selected.status}
                </span>
              </div>

              <div className={styles.section}>
                <p className={styles.label}>Customer</p>
                <p className={styles.value}>{selected.userId?.name ?? "Unknown"}</p>
                {selected.userId?.phone && <p className={shared.muted}>{selected.userId.phone}</p>}
                {selected.userId?.email && <p className={shared.muted}>{selected.userId.email}</p>}
              </div>

              <div className={styles.section}>
                <p className={styles.label}>{selected.mode === "pickup" ? "Pickup" : "Delivery address"}</p>
                <p className={styles.value}>
                  {selected.mode === "pickup" ? selected.restaurantName ?? "Restaurant" : selected.address || "No address on file"}
                </p>
              </div>

              <div className={styles.section}>
                <p className={styles.label}>Items</p>
                {(selected.items ?? []).map((i) => (
                  <div key={i.menuItemName} className={styles.itemRow}>
                    <span>
                      {i.menuItemName} × {i.quantity}
                    </span>
                    <span>{inr(i.priceInr * i.quantity)}</span>
                  </div>
                ))}
                {selected.couponCode && (
                  <div className={styles.itemRow} style={{ color: "#15803d" }}>
                    <span>Discount ({selected.couponCode})</span>
                    <span>−{inr(selected.discountInr ?? 0)}</span>
                  </div>
                )}
                <div className={styles.total}>
                  <span>Total</span>
                  <span>{inr(selected.totalInr)}</span>
                </div>
              </div>

              <div className={styles.section}>
                <p className={styles.label}>Placed</p>
                <p className={styles.value}>{new Date(selected.createdAt).toLocaleString("en-IN")}</p>
              </div>

              <div className={styles.section}>
                <button className={styles.btn} onClick={advance} disabled={!next || busy}>
                  {busy
                    ? "Updating..."
                    : next
                    ? `Mark as ${LABEL[next] ?? next}`
                    : selected.status === "cancelled"
                    ? "Order cancelled"
                    : "Order completed"}
                </button>
                {actionError && <p className={styles.error}>{actionError}</p>}
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}