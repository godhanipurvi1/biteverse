"use client";

import { useEffect, useState } from "react";

export type OfferType = "flat" | "percent" | "free_delivery";

export type Offer = {
  code: string;
  title: string;
  type: OfferType;
  value: number;
  minSubtotal: number;
  maxDiscount?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// The API sends "fixed" for flat-amount offers. The cart calls them "flat".
function mapType(t: unknown): OfferType | null {
  if (t === "fixed" || t === "flat") return "flat";
  if (t === "percent") return "percent";
  if (t === "free_delivery") return "free_delivery";
  return null;
}

function parseOffer(input: unknown): Offer | null {
  if (!input || typeof input !== "object") return null;
  const r = input as Record<string, unknown>;
  if (typeof r.code !== "string" || r.code.trim() === "") return null;
  if (r.active === false) return null;
  const type = mapType(r.type);
  if (!type) return null;

  const value = Number(r.value ?? 0);
  const minSubtotal = Number(r.minSubtotal ?? 0);
  if (!Number.isFinite(value) || !Number.isFinite(minSubtotal)) return null;

  const code = r.code.trim().toUpperCase();
  return {
    code,
    title: typeof r.title === "string" && r.title ? r.title : code,
    type,
    value,
    minSubtotal,
    maxDiscount:
      r.maxDiscount != null && Number.isFinite(Number(r.maxDiscount)) ? Number(r.maxDiscount) : undefined,
  };
}

export function computeOffer(
  offer: Offer | null,
  subtotal: number,
  deliveryFee: number
): { discount: number; freeDelivery: boolean } {
  if (!offer) return { discount: 0, freeDelivery: false };
  switch (offer.type) {
    case "flat":
      return { discount: Math.min(offer.value, subtotal), freeDelivery: false };
    case "percent": {
      let d = Math.round((subtotal * offer.value) / 100);
      if (offer.maxDiscount !== undefined) d = Math.min(d, offer.maxDiscount);
      return { discount: Math.min(d, subtotal), freeDelivery: false };
    }
    case "free_delivery":
      return { discount: 0, freeDelivery: deliveryFee > 0 };
    default:
      return { discount: 0, freeDelivery: false };
  }
}

export type OffersStatus = "loading" | "ready" | "error";

export function useOffers() {
  const [offers, setOffers] = useState<Record<string, Offer>>({});
  const [status, setStatus] = useState<OffersStatus>("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/api/offers`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Offers request failed: ${res.status}`);
        return res.json();
      })
      .then((json: { data?: unknown[] }) => {
        const map: Record<string, Offer> = {};
        for (const raw of Array.isArray(json?.data) ? json.data : []) {
          const offer = parseOffer(raw);
          if (offer) map[offer.code] = offer;
        }
        setOffers(map);
        setStatus("ready");
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setStatus("error");
      });

    return () => controller.abort();
  }, []);

  return { offers, status };
}
