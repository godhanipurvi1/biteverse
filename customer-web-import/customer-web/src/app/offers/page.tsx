"use client";

import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import styles from "./offers.module.css";

type ApiOffer = {
  code: string;
  title?: string;
  description?: string;
  type: string;
  value?: number;
  minSubtotal?: number;
  maxDiscount?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function headline(o: ApiOffer): string {
  const v = Number(o.value ?? 0);
  if (o.type === "percent") return `${v}% off`;
  if (o.type === "fixed" || o.type === "flat") return `₹${v} off`;
  if (o.type === "free_delivery") return "₹0 fee";
  return o.title ?? o.code;
}

function fineprint(o: ApiOffer): string {
  if (o.description) return o.description;
  const parts: string[] = [];
  if (o.type === "percent" && o.maxDiscount) parts.push(`Up to ₹${o.maxDiscount} off`);
  if (o.minSubtotal) parts.push(`on orders above ₹${o.minSubtotal}`);
  return parts.join(" ") || "Applies at checkout";
}

export default function OffersPage() {
  const [offers, setOffers] = useState<ApiOffer[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/offers`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Offers request failed: ${res.status}`);
        return res.json();
      })
      .then((json: { data?: ApiOffer[] }) => {
        setOffers(Array.isArray(json.data) ? json.data : []);
        setStatus("ready");
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, []);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard blocked. The code stays visible so it can be copied by hand.
    }
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
  }

  // The middle offer is highlighted, as in the design.
  const featuredIndex = offers.length >= 2 ? 1 : -1;

  return (
    <Shell>
      <div className={styles.wrap}>
        <h1 className={styles.title}>Today&apos;s offers</h1>
        <p className={styles.sub}>Copy a code and paste it at checkout.</p>

        {status === "loading" && <p className={styles.muted}>Loading offers…</p>}
        {status === "error" && (
          <p className={styles.errorBox}>Couldn&apos;t load offers. Check that the backend is running.</p>
        )}
        {status === "ready" && offers.length === 0 && (
          <p className={styles.muted}>No offers right now. Check back soon.</p>
        )}

        <div className={styles.grid}>
          {offers.map((o, i) => {
            const featured = i === featuredIndex;
            return (
              <article key={o.code} className={`${styles.card} ${featured ? styles.featured : ""}`}>
                <div className={styles.kicker}>{o.title ?? "Offer"}</div>
                <div className={styles.headline}>{headline(o)}</div>
                <p className={styles.desc}>{fineprint(o)}</p>
                <div className={styles.codeRow}>
                  <span className={styles.code}>{o.code}</span>
                  <button className={styles.copyBtn} onClick={() => copyCode(o.code)}>
                    {copied === o.code ? "Copied" : "Copy"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
