"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Shell from "../../components/Shell";
import { addToCart } from "../../lib/cart";
import { API_URL, TOKEN_KEY } from "../../lib/orders";
import styles from "./orders.module.css";

const GUEST_KEY = "biteverse-guest-codes";

type Line = { id: string; name: string; price: number; qty: number };

type Order = {
  id: string;
  trackingCode: string;
  restaurantId: string;
  restaurant: string;
  createdAt: string;
  placedAt: string;
  step: number; // 0 Placed, 1 Confirmed, 2 Preparing, 3 On the way, 4 Delivered
  cancelled: boolean;
  lines: Line[];
  total: number;
};

type ServerOrder = {
  _id: string;
  trackingCode: string;
  restaurantId: string;
  restaurantName: string;
  items: { menuItemId?: string; name: string; qty: number; price?: number }[];
  total: number;
  status: string;
  createdAt: string;
};

type TrackOrder = {
  id: string;
  restaurantName: string;
  items: { name: string; qty: number; price: number; lineTotal: number }[];
  total: number;
  status: string;
};

type Tracking = { trackingCode: string; createdAt: string; orders: TrackOrder[] };

const STEPS = ["Placed", "Confirmed", "Preparing", "On the way", "Delivered"];
const STEP_MESSAGES = [
  "Order placed",
  "Restaurant confirmed your order",
  "Your food is being prepared",
  "Your rider is on the way",
  "Delivered. Enjoy your meal",
];

const STEP_OF_STATUS: Record<string, number> = {
  placed: 0,
  confirmed: 1,
  preparing: 2,
  ready: 2,
  out_for_delivery: 3,
  delivered: 4,
};

const shortId = (id: string) => `BV-${id.slice(-4).toUpperCase()}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function fromAccount(o: ServerOrder): Order {
  return {
    id: shortId(o._id),
    trackingCode: o.trackingCode,
    restaurantId: String(o.restaurantId ?? ""),
    restaurant: o.restaurantName,
    createdAt: o.createdAt,
    placedAt: formatDate(o.createdAt),
    step: STEP_OF_STATUS[o.status] ?? 0,
    cancelled: o.status === "cancelled",
    lines: (o.items ?? []).map((i) => ({
      id: String(i.menuItemId ?? i.name),
      name: i.name,
      price: i.price ?? 0,
      qty: i.qty,
    })),
    total: o.total,
  };
}

function fromTracking(t: Tracking, o: TrackOrder): Order {
  return {
    id: shortId(o.id),
    trackingCode: t.trackingCode,
    restaurantId: "",
    restaurant: o.restaurantName,
    createdAt: t.createdAt,
    placedAt: formatDate(t.createdAt),
    step: STEP_OF_STATUS[o.status] ?? 0,
    cancelled: o.status === "cancelled",
    lines: o.items.map((i) => ({ id: i.name, name: i.name, price: i.price, qty: i.qty })),
    total: o.total,
  };
}

const fmt = (n: number) => "\u20b9" + Math.round(n).toLocaleString("en-IN");

function readGuestCodes(): string[] {
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((c) => typeof c === "string") : [];
  } catch {
    return [];
  }
}

function saveGuestCodes(codes: string[]) {
  try {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify(codes));
  } catch {
    // storage blocked: codes still show for this page visit
  }
}

function Tracker({ step }: { step: number }) {
  return (
    <div className={styles.tracker}>
      <div className={styles.trackLine}>
        <div className={styles.trackFill} style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
      </div>
      <div className={styles.trackSteps}>
        {STEPS.map((label, i) => (
          <div key={label} className={styles.trackStep}>
            <span className={`${styles.dot} ${i <= step ? styles.dotDone : ""}`}>
              {i === step && step < 4 ? "\u{1F6F5}" : ""}
            </span>
            <span className={`${styles.stepLabel} ${i <= step ? styles.stepDone : ""}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order, initiallyOpen }: { order: Order; initiallyOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(initiallyOpen);
  const delivered = !order.cancelled && order.step === 4;
  const itemsText = order.lines.map((l) => `${l.qty} \u00d7 ${l.name}`).join(", ");

  function reorder() {
    for (const l of order.lines) {
      for (let i = 0; i < l.qty; i++) {
        addToCart({ _id: order.restaurantId, name: order.restaurant }, { _id: l.id, name: l.name, price: l.price });
      }
    }
    router.push("/cart");
  }

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <div>
          <div className={styles.meta}>ORDER {order.id} \u00b7 {order.placedAt}</div>
          <h3 className={styles.restaurant}>{order.restaurant}</h3>
        </div>
        {order.cancelled ? (
          <span className={styles.badgeDone}>{"\u2715 Cancelled"}</span>
        ) : delivered ? (
          <span className={styles.badgeDone}>{"\u25cf Delivered"}</span>
        ) : (
          <span className={styles.badgeLive}>{"\u25cf " + STEPS[order.step]}</span>
        )}
      </div>

      {open && !order.cancelled && (
        <>
          <Tracker step={order.step} />
          <div className={styles.statusBox}>
            {(delivered ? "\u2713 " : "\u{1F552} ") + STEP_MESSAGES[order.step]}
          </div>
        </>
      )}
      {open && order.cancelled && <div className={styles.statusBox}>This order was cancelled.</div>}

      <p className={styles.items}>{order.lines.map((l) => `${l.qty} \u00d7 ${l.name}`).join(", ")}</p>

      <div className={styles.foot}>
        <strong>{fmt(order.total)}</strong>
        <div className={styles.actions}>
          <Link href={`/track/${order.trackingCode}`} className={styles.ghostBtn}>Track</Link>
          {!order.cancelled && (
            <button className={styles.ghostBtn} onClick={() => setOpen((o) => !o)}>
              {open ? "Hide status" : "View status"}
            </button>
          )}
          {order.restaurantId && (
            <button className={styles.primaryBtn} onClick={reorder}>Reorder</button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      // Codes from checkout (?placed=CODE1,CODE2) are saved in this browser.
      const fromUrl = new URLSearchParams(window.location.search).get("placed");
      const guestCodes = readGuestCodes();
      if (fromUrl) {
        for (const c of fromUrl.split(",").map((s) => s.trim()).filter(Boolean)) {
          if (!guestCodes.includes(c)) guestCodes.push(c);
        }
        saveGuestCodes(guestCodes);
      }

      const token = window.localStorage.getItem(TOKEN_KEY);
      const collected: Order[] = [];
      let accountMissing = !token;

      // 1. Orders saved to the logged-in account.
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/orders`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 401) {
            accountMissing = true;
          } else if (res.ok) {
            const json = await res.json();
            for (const o of json.data as ServerOrder[]) collected.push(fromAccount(o));
          } else {
            setError("Could not load your account orders.");
          }
        } catch {
          setError("Could not reach the server. Retrying...");
        }
      }

      // 2. Orders placed in this browser (guest checkout), by tracking code.
      for (const code of guestCodes) {
        try {
          const res = await fetch(`${API_URL}/api/orders/track/${encodeURIComponent(code)}`, { cache: "no-store" });
          if (res.ok) {
            const t = (await res.json()) as Tracking;
            for (const o of t.orders) collected.push(fromTracking(t, o));
          }
        } catch {
          // skip this code for now; the next refresh tries again
        }
      }

      if (alive) {
        const seen = new Set<string>();
        const unique = collected.filter((o) => {
          const key = o.trackingCode + "|" + o.id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        unique.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        setOrders(unique);
        setNeedLogin(accountMissing && guestCodes.length === 0);
        setLoaded(true);
        timer = setTimeout(load, 10000);
      }
    }

    load();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const activeOrders = orders.filter((o) => !o.cancelled && o.step < 4);
  const pastOrders = orders.filter((o) => o.cancelled || o.step === 4);

  return (
    <Shell hideFooter>
      <div className={styles.wrap}>
        <h1 className={styles.title}>My orders</h1>
        <p className={styles.sub}>Follow your order live and reorder your favourites.</p>

        {error && <div className={styles.banner}>{error}</div>}

        {activeOrders.length > 0 && (
          <div className={styles.banner}>
            {"\u2713 Order " + activeOrders[0].id + " is " + STEPS[activeOrders[0].step].toLowerCase() + "."}
          </div>
        )}

        {!loaded ? (
          <p className={styles.sub}>Loading your orders...</p>
        ) : needLogin ? (
          <p className={styles.sub}>Log in to see your orders.</p>
        ) : orders.length === 0 ? (
          <p className={styles.sub}>You have no orders yet.</p>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <>
                <h2 className={styles.section}>On its way</h2>
                <div className={styles.grid}>
                  {activeOrders.map((o) => (
                    <OrderCard key={o.trackingCode + "|" + o.id} order={o} initiallyOpen />
                  ))}
                </div>
              </>
            )}

            {pastOrders.length > 0 && (
              <>
                <h2 className={styles.section}>Past orders</h2>
                <div className={styles.grid}>
                  {pastOrders.map((o, i) => (
                    <OrderCard key={o.trackingCode + "|" + o.id} order={o} initiallyOpen={i === 0} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}