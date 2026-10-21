"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMe, resendVerification, type PublicUser } from "@/features/auth/auth.api";
import { LogoutButton } from "@/features/auth/ui/LogoutButton";
import { getAdminOffers, getAdminOrders, inr } from "./admin.api";
import shared from "./admin-dashboard.module.css";
import styles from "./admin-profile.module.css";

type Row = {
  _id: string;
  status: string;
  totalInr: number;
  createdAt: string;
  restaurantName?: string;
  userId?: { name?: string } | null;
};

type Offer = { _id: string; active: boolean };

const ACTIVE_STATUSES = ["placed", "accepted", "preparing", "out-for-delivery"];

const STATUS_LABEL: Record<string, string> = {
  placed: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export function AdminProfile() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [orders, setOrders] = useState<Row[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const me = await getMe();
        if (!alive) return;
        setUser(me);

        // allSettled: one failing request should not hide the whole profile
        const [o, f] = await Promise.allSettled([getAdminOrders(), getAdminOffers()]);
        if (!alive) return;
        if (o.status === "fulfilled") setOrders(o.value.orders as unknown as Row[]);
        if (f.status === "fulfilled") setOffers(f.value.offers as unknown as Offer[]);
      } catch (e) {
        console.error("Profile load failed:", e);
        if (alive) setError("Could not load your profile.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== "cancelled");
    return {
      ordersToday: orders.filter((o) => isToday(o.createdAt)).length,
      inProgress: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      revenue: live.reduce((s, o) => s + o.totalInr, 0),
      activeOffers: offers.filter((o) => o.active).length,
    };
  }, [orders, offers]);

  const recent = orders.slice(0, 5);

  const copyEmail = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const onResend = async () => {
    if (!user) return;
    setResendBusy(true);
    setNotice("");
    try {
      const data = await resendVerification(user.email);
      setNotice(data.message);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not send the email.");
    } finally {
      setResendBusy(false);
    }
  };

  if (loading) return <div className={shared.state}>Loading profile...</div>;
  if (error || !user) return <div className={shared.state}>{error || "Profile not found."}</div>;

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <section>
      <div className={shared.welcome}>
        <div>
          <h1 className={shared.title}>My profile</h1>
          <p className={shared.subtitle}>Your account, your activity, and quick access to admin tools.</p>
        </div>
        <LogoutButton className={styles.logout} />
      </div>

      {!user.emailVerified && (
        <div className={styles.warnBanner}>
          <div>
            <strong>Your email is not verified.</strong>
            <p className={shared.muted} style={{ margin: "0.2rem 0 0" }}>
              Verify it to protect your admin account.
            </p>
          </div>
          <button className={styles.btnSolid} onClick={onResend} disabled={resendBusy}>
            {resendBusy ? "Sending..." : "Resend verification"}
          </button>
        </div>
      )}
      {notice && <p className={styles.notice}>{notice}</p>}

      <div className={shared.card}>
        <div className={styles.head}>
          <div className={styles.avatar}>{initial}</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <p className={styles.name}>{user.name}</p>
            <p className={styles.email}>
              {user.email}
              <button className={styles.copy} onClick={copyEmail}>
                {copied ? "Copied" : "Copy"}
              </button>
            </p>
            <div className={styles.tags}>
              <span className={`${shared.badge} ${shared.info}`}>Administrator</span>
              <span className={`${shared.badge} ${user.emailVerified ? shared.ok : shared.warn}`}>
                {user.emailVerified ? "Email verified" : "Email not verified"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={shared.stat}>
          <div className={shared.statIcon}>#</div>
          <div>
            <p className={shared.statLabel}>Orders today</p>
            <p className={shared.statValue}>{stats.ordersToday}</p>
          </div>
        </div>
        <div className={shared.stat}>
          <div className={shared.statIcon}>◷</div>
          <div>
            <p className={shared.statLabel}>In progress</p>
            <p className={shared.statValue}>{stats.inProgress}</p>
          </div>
        </div>
        <div className={shared.stat}>
          <div className={shared.statIcon}>₹</div>
          <div>
            <p className={shared.statLabel}>Revenue (all time)</p>
            <p className={shared.statValue}>{inr(stats.revenue)}</p>
          </div>
        </div>
        <div className={shared.stat}>
          <div className={shared.statIcon}>%</div>
          <div>
            <p className={shared.statLabel}>Active offers</p>
            <p className={shared.statValue}>{stats.activeOffers}</p>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={shared.card}>
          <div className={shared.cardHead}>
            <h2 className={shared.cardTitle}>Personal information</h2>
          </div>
          <dl className={styles.dl}>
            <dt>Full name</dt>
            <dd>{user.name}</dd>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Phone</dt>
            <dd>{user.phone || "Not added"}</dd>
            <dt>Role</dt>
            <dd>{user.role}</dd>
          </dl>
        </div>

        <div className={shared.card}>
          <div className={shared.cardHead}>
            <h2 className={shared.cardTitle}>Security</h2>
          </div>
          <div className={styles.secRow}>
            <div>
              <p className={styles.rowTitle}>Password</p>
              <p className={shared.muted} style={{ margin: 0 }}>Reset it by email link</p>
            </div>
            <Link href="/forgot-password" className={styles.btnOutline}>Change</Link>
          </div>
          <div className={styles.secRow}>
            <div>
              <p className={styles.rowTitle}>Email verification</p>
              <p className={shared.muted} style={{ margin: 0 }}>
                {user.emailVerified ? "Verified" : "Not verified"}
              </p>
            </div>
            {!user.emailVerified && (
              <button className={styles.btnOutline} onClick={onResend} disabled={resendBusy}>
                Send link
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={shared.card}>
          <div className={shared.cardHead}>
            <h2 className={shared.cardTitle}>Recent orders</h2>
            <Link href="/admin/orders" className={shared.link}>View all →</Link>
          </div>
          {recent.length === 0 && <p className={shared.muted}>No orders yet.</p>}
          {recent.map((o) => (
            <div key={o._id} className={styles.listRow}>
              <div>
                <p className={styles.rowTitle}>
                  #{o._id.slice(-8).toUpperCase()} · {o.userId?.name ?? "Customer"}
                </p>
                <p className={shared.muted} style={{ margin: 0 }}>
                  {o.restaurantName ?? "—"} · {timeOf(o.createdAt)} · {inr(o.totalInr)}
                </p>
              </div>
              <span className={styles.statusPill}>{STATUS_LABEL[o.status] ?? o.status}</span>
            </div>
          ))}
        </div>

        <div className={shared.card}>
          <div className={shared.cardHead}>
            <h2 className={shared.cardTitle}>Quick access</h2>
          </div>
          <div className={styles.quick}>
            <Link href="/admin" className={styles.quickItem}>Dashboard</Link>
            <Link href="/admin/orders" className={styles.quickItem}>Orders</Link>
            <Link href="/admin/offers" className={styles.quickItem}>Offers &amp; coupons</Link>
            <Link href="/admin/menu" className={styles.quickItem}>Menu</Link>
          </div>
        </div>
      </div>
    </section>
  );
}