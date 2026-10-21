"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getAdminOffers, inr } from "./admin.api";
import { api } from "@/lib/api/client";
import shared from "./admin-dashboard.module.css";
import styles from "./admin-offers.module.css";

type Offer = {
  _id: string;
  code: string;
  title: string;
  description?: string;
  type: "percent" | "flat";
  value: number; // percent points, or paise for flat
  minSubtotalInr?: number; // paise
  maxDiscountInr?: number; // paise
  active: boolean;
};

type Filter = "all" | "active" | "off";

const discountText = (o: Offer) =>
  o.type === "percent" ? `${o.value}% off` : `${inr(o.value)} off`;

export function AdminOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState("");

  // Form state
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");

  const load = async () => {
    try {
      const data = await getAdminOffers();
      setOffers(data.offers as unknown as Offer[]);
      setError("");
    } catch (e) {
      console.error("Admin offers load failed:", e);
      setError("Could not load offers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: offers.length,
      active: offers.filter((o) => o.active).length,
      off: offers.filter((o) => !o.active).length,
      percent: offers.filter((o) => o.type === "percent").length,
    }),
    [offers]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return offers.filter((o) => {
      if (filter === "active" && !o.active) return false;
      if (filter === "off" && o.active) return false;
      if (q && !`${o.code} ${o.title}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [offers, filter, search]);

  const toggle = async (o: Offer) => {
    setBusyId(o._id);
    setRowError("");
    try {
      await api(`/admin/offers/${o._id}`, { method: "PATCH", body: { active: !o.active } });
      await load();
    } catch (e) {
      setRowError(e instanceof Error ? e.message : "Could not update the coupon.");
    } finally {
      setBusyId(null);
    }
  };

  const onCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setFormNotice("");
    const numValue = Number(value);
    if (!code.trim() || !title.trim() || !numValue) {
      setFormError("Enter a code, a title, and a discount value.");
      return;
    }
    // Rupee inputs become paise for flat discounts and order limits
    const body = {
      code: code.trim().toUpperCase(),
      title: title.trim(),
      type,
      value: type === "flat" ? Math.round(numValue * 100) : numValue,
      minSubtotalInr: minOrder ? Math.round(Number(minOrder) * 100) : undefined,
      maxDiscountInr: maxDiscount ? Math.round(Number(maxDiscount) * 100) : undefined,
      active: true,
    };
    setCreating(true);
    try {
      await api("/admin/offers", { method: "POST", body });
      setFormNotice(`Created ${body.code}.`);
      setCode("");
      setTitle("");
      setValue("");
      setMinOrder("");
      setMaxDiscount("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create the coupon.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section>
      <div className={shared.welcome}>
        <div>
          <h1 className={shared.title}>Offers &amp; coupons</h1>
          <p className={shared.subtitle}>Create promotions and manage discounts.</p>
        </div>
      </div>

      <div className={shared.stats}>
        <div className={shared.stat}>
          <div className={shared.statIcon}>%</div>
          <div>
            <p className={shared.statLabel}>Total offers</p>
            <p className={shared.statValue}>{loading ? "…" : stats.total}</p>
          </div>
        </div>
        <div className={shared.stat}>
          <div className={shared.statIcon}>✓</div>
          <div>
            <p className={shared.statLabel}>Active offers</p>
            <p className={shared.statValue}>{loading ? "…" : stats.active}</p>
          </div>
        </div>
        <div className={shared.stat}>
          <div className={shared.statIcon}>◌</div>
          <div>
            <p className={shared.statLabel}>Switched off</p>
            <p className={shared.statValue}>{loading ? "…" : stats.off}</p>
          </div>
        </div>
        <div className={shared.stat}>
          <div className={shared.statIcon}>₹</div>
          <div>
            <p className={shared.statLabel}>Flat vs percent</p>
            <p className={shared.statValue}>
              {loading ? "…" : `${stats.percent} / ${stats.total - stats.percent}`}
            </p>
          </div>
        </div>
      </div>

      {error && <div className={shared.state} style={{ marginTop: "1rem" }}>{error}</div>}

      <div className={styles.layout}>
        <div className={shared.card}>
          <div className={styles.tabs}>
            {(
              [
                { key: "all", label: `All (${stats.total})` },
                { key: "active", label: `Active (${stats.active})` },
                { key: "off", label: `Off (${stats.off})` },
              ] as { key: Filter; label: string }[]
            ).map((t) => (
              <button
                key={t.key}
                className={`${styles.tab} ${filter === t.key ? styles.tabActive : ""}`}
                onClick={() => setFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.toolbar}>
            <input
              className={styles.search}
              type="search"
              placeholder="Search by code or title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {rowError && <p className={styles.error} style={{ marginBottom: "0.6rem" }}>{rowError}</p>}

          {!loading && visible.length === 0 && (
            <p className={shared.muted}>No offers match these filters.</p>
          )}

          {visible.length > 0 && (
            <table className={shared.table}>
              <thead>
                <tr>
                  <th>Offer</th>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min order</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <strong>{o.title}</strong>
                      {o.description && <p className={shared.muted} style={{ margin: 0 }}>{o.description}</p>}
                    </td>
                    <td>
                      <span className={styles.code}>{o.code}</span>
                    </td>
                    <td>{discountText(o)}</td>
                    <td>{o.minSubtotalInr ? inr(o.minSubtotalInr) : "None"}</td>
                    <td>
                      <button
                        className={`${styles.switch} ${o.active ? styles.switchOn : ""}`}
                        onClick={() => toggle(o)}
                        disabled={busyId === o._id}
                        aria-pressed={o.active}
                        aria-label={`${o.active ? "Switch off" : "Switch on"} ${o.code}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className={shared.card}>
          <h2 className={shared.cardTitle} style={{ marginBottom: "0.9rem" }}>Create new offer</h2>
          <form className={styles.form} onSubmit={onCreate}>
            <label className={styles.field}>
              Offer name
              <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Flat 20% off" />
            </label>
            <div className={styles.row2}>
              <label className={styles.field}>
                Coupon code
                <input className={styles.input} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. BITE20" />
              </label>
              <label className={styles.field}>
                Discount type
                <select className={styles.select} value={type} onChange={(e) => setType(e.target.value as "percent" | "flat")}>
                  <option value="percent">Percent off</option>
                  <option value="flat">Flat amount (₹)</option>
                </select>
              </label>
            </div>
            <label className={styles.field}>
              {type === "percent" ? "Discount (%)" : "Discount (₹)"}
              <input className={styles.input} type="number" min="1" value={value} onChange={(e) => setValue(e.target.value)} />
            </label>
            <div className={styles.row2}>
              <label className={styles.field}>
                Min order (₹)
                <input className={styles.input} type="number" min="0" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
              </label>
              <label className={styles.field}>
                Max discount (₹)
                <input className={styles.input} type="number" min="0" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} />
              </label>
            </div>
            <p className={styles.hint}>Leave min order or max discount blank for no limit.</p>

            {formError && <p className={styles.error}>{formError}</p>}
            {formNotice && <p className={styles.success}>{formNotice}</p>}

            <button className={styles.btn} type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create offer"}
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}