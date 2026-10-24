"use client";

import { useEffect, useState } from "react";
import { API_URL, TOKEN_KEY } from "../../lib/orders";

type Props = { orderId: string; trackingCode: string };

const box = {
  marginTop: 14,
  padding: 14,
  borderRadius: 12,
  border: "1px solid var(--line, #2f2923)",
  display: "grid",
  gap: 10,
} as const;

export default function ReviewBox({ orderId, trackingCode }: Props) {
  const [reviewed, setReviewed] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/api/reviews/check?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (alive) setReviewed(Boolean(j.reviewed));
      })
      .catch(() => {
        if (alive) setReviewed(false);
      });
    return () => {
      alive = false;
    };
  }, [orderId]);

  async function submit() {
    if (rating < 1) {
      setMsg("Tap a star to rate this order.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const token = window.localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId, trackingCode, rating, text }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) setReviewed(true);
      else setMsg(j.message || "Could not save your review.");
    } catch {
      setMsg("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (reviewed === null) return null;
  if (reviewed) {
    return (
      <div style={box}>
        <strong>Thanks for reviewing this order.</strong>
      </div>
    );
  }

  return (
    <div style={box}>
      <strong>Rate this order</strong>
      <div role="group" aria-label="Rating" style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", color: "#ff7a3d", padding: 0 }}
          >
            {n <= (hover || rating) ? "\u2605" : "\u2606"}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Tell others about your food (optional)"
        style={{
          padding: 10,
          borderRadius: 10,
          border: "1px solid var(--line, #2f2923)",
          background: "transparent",
          color: "inherit",
          font: "inherit",
        }}
      />
      {msg && <p style={{ margin: 0, color: "#ff7070", fontSize: 13 }}>{msg}</p>}
      <div>
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            border: "none",
            background: "#ff7a3d",
            color: "#120f0d",
            fontWeight: 700,
            cursor: "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Saving..." : "Submit review"}
        </button>
      </div>
    </div>
  );
}