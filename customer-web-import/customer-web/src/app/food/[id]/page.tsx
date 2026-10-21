"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart, addToCart, changeQty } from "../../../lib/cart";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const RUPEE = "\u20B9";

type MenuItem = { _id: string; name: string; price: number; description?: string; veg?: boolean; available?: boolean };
type Restaurant = {
  _id: string;
  name: string;
  address?: string;
  cuisine?: string | string[];
  rating?: number;
  deliveryMinutes?: { min: number; max: number };
  menu?: MenuItem[];
};
type Found = { restaurant: Restaurant; item: MenuItem };

function dishSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function FoodDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const cart = useCart();
  const [found, setFound] = useState<Found | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [photoOk, setPhotoOk] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetch(`${API_URL}/api/restaurants`, { signal: controller.signal })
      .then((res) => res.json() as Promise<{ data?: Restaurant[] }>)
      .then((json) => {
        for (const r of json.data ?? []) {
          const item = (r.menu ?? []).find((m) => m._id === id);
          if (item) {
            setFound({ restaurant: r, item });
            setStatus("ready");
            return;
          }
        }
        setStatus("missing");
      })
      .catch((err) => {
        if (err.name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, [id]);

  const pageStyle = { padding: "24px 16px", maxWidth: 720, margin: "0 auto" } as const;

  if (status === "loading") {
    return <main className="container" style={pageStyle}><p>Loading dish...</p></main>;
  }
  if (status === "missing") {
    return (
      <main className="container" style={pageStyle}>
        <h1>Dish not found</h1>
        <Link href="/#restaurants">Back to restaurants</Link>
      </main>
    );
  }
  if (status === "error" || !found) {
    return (
      <main className="container" style={pageStyle}>
        <h1>Could not load this dish</h1>
        <p>Check that the backend is running on port 5000.</p>
        <Link href="/#restaurants">Back to restaurants</Link>
      </main>
    );
  }

  const { restaurant, item } = found;
  const line = cart?.lines.find((l) => l.id === item._id);
  const qty = line?.qty ?? 0;
  const available = item.available !== false;
  const veg = typeof item.veg === "boolean" ? item.veg : null;
  const cuisine = Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(", ") : restaurant.cuisine;

  return (
    <main className="container" style={pageStyle}>
      <Link href="/#restaurants">Back to restaurants</Link>

      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", borderRadius: 14, overflow: "hidden", background: "#f3eee6", margin: "16px 0" }}>
        {photoOk ? (
          <img
            src={`/images/menu/${dishSlug(item.name)}.jpg`}
            alt={item.name}
            onError={() => setPhotoOk(false)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, fontWeight: 800, opacity: 0.4 }}>
            {item.name.charAt(0)}
          </div>
        )}
      </div>

      <h1 style={{ marginBottom: 6 }}>
        {veg !== null && <span className={`vdot ${veg ? "veg" : "nonveg"}`} aria-label={veg ? "Veg" : "Non-veg"} />}
        {item.name}
      </h1>
      {veg !== null && <p style={{ margin: "0 0 8px", fontSize: 14 }}>{veg ? "Veg" : "Non-veg"}</p>}
      <p style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>{RUPEE}{item.price}</p>
      <p style={{ marginBottom: 20 }}>{item.description?.trim() ? item.description : "Description not available."}</p>

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 20 }}>
        <strong>{restaurant.name}</strong>
        {restaurant.address && <div style={{ fontSize: 14, opacity: 0.8 }}>{restaurant.address}</div>}
        {cuisine && <div style={{ fontSize: 14, opacity: 0.8 }}>{cuisine}</div>}
        {restaurant.rating !== undefined && <div style={{ fontSize: 14 }}>Rating {restaurant.rating}</div>}
        {restaurant.deliveryMinutes && (
          <div style={{ fontSize: 14 }}>Delivery in {restaurant.deliveryMinutes.min}-{restaurant.deliveryMinutes.max} min</div>
        )}
      </section>

      {!available ? (
        <p style={{ fontWeight: 700 }}>Currently unavailable</p>
      ) : qty === 0 ? (
        <button type="button" onClick={() => addToCart(restaurant, item)} style={{ padding: "12px 20px", fontWeight: 700, width: "100%" }}>
          Add to cart
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" onClick={() => changeQty(item._id, -1)} aria-label={`Remove one ${item.name}`} style={{ padding: "8px 16px" }}>-</button>
            <span aria-live="polite" style={{ fontWeight: 700 }}>{qty}</span>
            <button type="button" onClick={() => addToCart(restaurant, item)} aria-label={`Add one ${item.name}`} style={{ padding: "8px 16px" }}>+</button>
          </div>
          <span>{RUPEE}{qty * item.price}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        {cart && cart.lines.length > 0 && <Link href="/checkout">Go to checkout</Link>}
      </div>
    </main>
  );
}
