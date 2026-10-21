"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import styles from "@/features/auth/auth.module.css";
import { createOffer, getAdminOffers, setOfferActive, type AdminOffer } from "@/features/admin/admin.api";

const inr = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [type, setType] = useState<"percent" | "fixed">("percent");

  const load = useCallback(async () => {
    try {
      setOffers((await getAdminOffers()).offers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load offers");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    const rupees = (k: string) => Math.round(Number(f.get(k) || 0) * 100);
    const value = type === "percent" ? Number(f.get("value")) : rupees("value");
    const body: Record<string, unknown> = {
      code: String(f.get("code") ?? ""),
      title: String(f.get("title") ?? ""),
      description: String(f.get("description") ?? ""),
      type,
      value,
      minSubtotalInr: rupees("min"),
    };
    if (type === "percent" && rupees("max") > 0) body.maxDiscountInr = rupees("max");
    setError(null);
    setNotice(null);
    try {
      await createOffer(body);
      form.reset();
      setNotice("Coupon created");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the coupon");
    }
  }

  async function toggle(o: AdminOffer) {
    setError(null);
    try {
      await setOfferActive(o._id, !o.active);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the coupon");
    }
  }

  return (
    <section className={styles.pageWide}>
      <div className={styles.panelHeader}>
        <div>
          <h1>Offers</h1>
          <p className={styles.muted}>{offers.length} coupons</p>
        </div>
        <Link href="/admin" className={styles.buttonOutline}>Back to admin</Link>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {notice && <p className={styles.success}>{notice}</p>}

      <form className={styles.card} onSubmit={onCreate}>
        <h2>New coupon</h2>
        <label className={styles.field}>Code
          <input className={styles.input} name="code" required placeholder="SAVE10" />
        </label>
        <label className={styles.field}>Title
          <input className={styles.input} name="title" required placeholder="10% off" />
        </label>
        <label className={styles.field}>Description
          <input className={styles.input} name="description" />
        </label>
        <label className={styles.field}>Type
          <select className={styles.input} value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")}>
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount off</option>
          </select>
        </label>
        <label className={styles.field}>{type === "percent" ? "Percent (1-100)" : "Amount off (₹)"}
          <input className={styles.input} name="value" type="number" min="1" step="1" required />
        </label>
        <label className={styles.field}>Minimum order (₹)
          <input className={styles.input} name="min" type="number" min="0" step="1" defaultValue="0" />
        </label>
        {type === "percent" && (
          <label className={styles.field}>Maximum discount (₹, optional)
            <input className={styles.input} name="max" type="number" min="0" step="1" />
          </label>
        )}
        <button className={styles.button} type="submit">Create coupon</button>
      </form>

      {offers.map((o) => (
        <div className={styles.card} key={o._id} style={{ marginTop: "1rem" }}>
          <div className={styles.panelHeader}>
            <div>
              <h3>{o.code} · {o.title}</h3>
              <p className={styles.muted}>
                {o.type === "percent" ? `${o.value}% off` : `${inr(o.value)} off`}
                {o.maxDiscountInr ? ` · up to ${inr(o.maxDiscountInr)}` : ""}
                {o.minSubtotalInr ? ` · min ${inr(o.minSubtotalInr)}` : ""}
              </p>
            </div>
            <span className={`${styles.badge} ${o.active ? styles.badgeOk : styles.badgeWarn}`}>
              {o.active ? "Active" : "Off"}
            </span>
          </div>
          <button className={styles.buttonSmall} onClick={() => toggle(o)}>
            {o.active ? "Switch off" : "Switch on"}
          </button>
        </div>
      ))}
    </section>
  );
}
