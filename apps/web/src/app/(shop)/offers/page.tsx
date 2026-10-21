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
          <p className={styles.muted}>Enter a code in your cart to save on your order.</p>
        </div>
        <Link href="/cart" className={styles.buttonOutline}>
          Go to cart
        </Link>
      </div>

      {loading && <p className={styles.muted}>Loading offers...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && offers.length === 0 && (
        <p className={styles.muted}>No offers right now. Check back soon.</p>
      )}

      <div className={styles.grid} style={{ marginTop: "1.5rem" }}>
        {offers.map((o) => (
          <div className={styles.card} key={o._id}>
            <span
              style={{
                display: "inline-block",
                border: "2px dashed var(--accent, #e85d0c)",
                borderRadius: 8,
                padding: "0.35rem 0.75rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                marginBottom: "0.75rem",
              }}
            >
              {o.code}
            </span>
            <h2 style={{ marginBottom: "0.25rem" }}>{o.title}</h2>
            {o.description && <p className={styles.muted}>{o.description}</p>}
            <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0.75rem 0" }}>
              {o.type === "percent" ? `${o.value}% off` : `${inr(o.value)} off`}
            </p>
            <p className={styles.muted} style={{ fontSize: "0.9rem" }}>
              {o.maxDiscountInr ? `Up to ${inr(o.maxDiscountInr)} · ` : ""}
              {o.minSubtotalInr ? `Min order ${inr(o.minSubtotalInr)}` : ""}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}