"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getOffers } from "@/features/orders/orders.api";
import styles from "@/features/offers/offers.module.css";

type Offer = {
  _id: string;
  code: string;
  title: string;
  description?: string;
  type: "percent" | "flat";
  value: number; // percent points, or paise for flat
  maxDiscountInr?: number; // paise
  minSubtotalInr?: number; // paise
  active?: boolean;
  expiresAt?: string;
};

type Filter = "all" | "percent" | "flat";

const inr = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

const headline = (o: Offer) =>
  o.type === "percent" ? `${o.value}% OFF` : `${inr(o.value)} OFF`;

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getOffers()
      .then((data: Offer[]) => {
        if (alive) setOffers(data.filter((o) => o.active !== false));
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load offers");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(
    () => (filter === "all" ? offers : offers.filter((o) => o.type === filter)),
    [offers, filter]
  );

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const featured = offers[0];

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <span className={styles.headerIcon} aria-hidden>%</span>
        <div>
          <h1 className={styles.title}>Offers &amp; deals</h1>
          <p className={styles.subtitle}>Save more on every delicious order.</p>
        </div>
      </div>

      <div className={styles.chips}>
        {(
          [
            { key: "all", label: "All offers" },
            { key: "percent", label: "Percent off" },
            { key: "flat", label: "Flat discount" },
          ] as { key: Filter; label: string }[]
        ).map((c) => (
          <button
            key={c.key}
            className={`${styles.chip} ${filter === c.key ? styles.chipActive : ""}`}
            onClick={() => setFilter(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading && <div className={styles.state}>Loading offers...</div>}
      {error && <div className={styles.state}>{error}</div>}

      {!loading && !error && visible.length === 0 && (
        <div className={styles.state}>No offers right now. Check back soon.</div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className={styles.grid}>
          {visible.map((o) => (
            <article key={o._id} className={styles.card}>
              <div className={styles.banner}>
                <span className={styles.bannerValue}>{headline(o)}</span>
                <span className={styles.bannerSub}>
                  {o.minSubtotalInr ? `on orders above ${inr(o.minSubtotalInr)}` : "on your order"}
                </span>
              </div>

              <div className={styles.body}>
                <h2 className={styles.name}>{o.title}</h2>
                {o.description && <p className={styles.desc}>{o.description}</p>}

                <div className={styles.facts}>
                  <div className={styles.fact}>
                    <span>Min. order</span>
                    <strong>{o.minSubtotalInr ? inr(o.minSubtotalInr) : "None"}</strong>
                  </div>
                  <div className={styles.fact}>
                    <span>Max discount</span>
                    <strong>{o.maxDiscountInr ? inr(o.maxDiscountInr) : "No cap"}</strong>
                  </div>
                  <div className={styles.fact}>
                    <span>Code</span>
                    <div className={styles.codeRow}>
                      <span className={styles.code}>{o.code}</span>
                      <button className={styles.copy} onClick={() => copyCode(o.code)}>
                        {copied === o.code ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                  {o.expiresAt && (
                    <div className={styles.fact}>
                      <span>Expires</span>
                      <strong>{new Date(o.expiresAt).toLocaleDateString("en-IN")}</strong>
                    </div>
                  )}
                </div>

                <div className={styles.actions}>
                  <span className={styles.link}>Applies at checkout</span>
                  <Link href="/cart" className={styles.cta}>
                    Use in cart
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {featured && !loading && !error && (
        <div className={styles.feature}>
          <div>
            <strong style={{ color: "#e85d0c" }}>Best offer for you</strong>
            <p className={styles.desc} style={{ margin: "0.25rem 0 0" }}>
              Copy <strong>{featured.code}</strong> and apply it in your cart.
            </p>
          </div>
          <div className={styles.codeRow}>
            <span className={styles.code}>{featured.code}</span>
            <button className={styles.copy} onClick={() => copyCode(featured.code)}>
              {copied === featured.code ? "Copied" : "Copy code"}
            </button>
            <Link href="/cart" className={styles.cta}>
              Apply now
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}