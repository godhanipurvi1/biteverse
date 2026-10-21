"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "@/features/auth/auth.module.css";
import { getOffers } from "@/features/orders/orders.api";

const inr = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOffers()
      .then(setOffers)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load offers"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={styles.pageWide}>
      <div className={styles.panelHeader}>
        <div>
          <h1>Offers</h1>
          <p className={styles.muted}>Enter a code in your cart to save on your order</p>
        </div>
        <Link href="/cart" className={styles.buttonOutline}>Go to cart</Link>
      </div>

      {loading && <p className={styles.muted}>Loading offers...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && offers.length === 0 && <p className={styles.muted}>No offers right now. Check back soon.</p>}

      <div className={styles.grid}>
        {offers.map((o) => (
          <div className={styles.card} key={o._id}>
            <span className={`${styles.badge} ${styles.badgeOk}`}>{o.code}</span>
            <h2>{o.title}</h2>
            {o.description && <p className={styles.muted}>{o.description}</p>}
            <p className={styles.muted}>
              {o.type === "percent" ? `${o.value}% off` : `${inr(o.value)} off`}
              {o.maxDiscountInr ? ` · up to ${inr(o.maxDiscountInr)}` : ""}
              {o.minSubtotalInr ? ` · min order ${inr(o.minSubtotalInr)}` : ""}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
