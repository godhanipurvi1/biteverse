"use client";

import { useEffect, useState } from "react";

export type Offer = {
  code: string;
  title: string;
  description: string;
  type: "percent" | "fixed";
  value: number;
  maxDiscount?: number;
  minSubtotal?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type Props = {
  onNotify: (message: string) => void;
};

export default function Offers({ onNotify }: Props) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [status, setStatus] = useState("Loading offers...");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/offers`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ offers?: Offer[]; data?: Offer[] }>;
      })
      .then((json) => {
        const list = json.offers ?? json.data ?? [];
        setOffers(list);
        setStatus(list.length ? "" : "No offers right now. Check back soon.");
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setStatus("Could not load offers.");
      });
    return () => controller.abort();
  }, []);

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      onNotify(`${code} copied`);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      onNotify("Select the code to copy it");
    }
  }

  function discountText(o: Offer) {
    return o.type === "percent" ? `${o.value}% off` : `\u20B9${o.value} off`;
  }

  return (
    <section id="offers" className="sec">
      <h2>Today&apos;s offers</h2>
      <p className="sub">Copy a code and apply it at checkout.</p>
      {status && <p role="status" className="status">{status}</p>}
      {offers.length > 0 && (
        <div className="offers">
          {offers.map((o) => (
            <article className="offer" key={o.code}>
              <span className="offer-label">{discountText(o)}</span>
              <p className="offer-title">{o.title}</p>
              <p className="offer-desc">{o.description}</p>
              <div className="code-row">
                <code>{o.code}</code>
                <button type="button" onClick={() => copy(o.code)}>
                  {copied === o.code ? "Copied" : "Copy"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

