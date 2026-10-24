"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Shell from "../../components/Shell";
import styles from "../orders/orders.module.css";

export default function TrackOrderPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = code.trim();
    if (!/^[A-Za-z0-9_-]{12}$/.test(clean)) {
      setError("Enter the 12-character tracking code from your confirmation.");
      return;
    }
    router.push("/track/" + clean);
  }

  return (
    <Shell hideFooter>
      <div className={styles.wrap}>
        <h1 className={styles.title}>Track order</h1>
        <p className={styles.sub}>Enter the tracking code to see the live status of your order.</p>
        <form onSubmit={submit} style={{ display: "flex", gap: 12, flexWrap: "wrap", maxWidth: 520 }}>
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }}
            placeholder="e.g. jQum-vbSuJia"
            aria-label="Tracking code"
            style={{ flex: 1, minWidth: 220, padding: "12px 14px", borderRadius: 12, border: "1px solid #3a2f29", background: "transparent", color: "inherit", fontSize: 15 }}
          />
          <button type="submit" className={styles.primaryBtn}>Track</button>
        </form>
        {error && <p className={styles.sub}>{error}</p>}
      </div>
    </Shell>
  );
}