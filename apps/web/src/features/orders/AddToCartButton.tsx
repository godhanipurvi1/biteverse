"use client";
import { useState } from "react";
import { addToCart } from "@/features/orders/orders.api";
import styles from "@/features/auth/auth.module.css";

export default function AddToCartButton({
  restaurantSlug,
  menuItemName,
  priceInr,
}: {
  restaurantSlug: string;
  menuItemName: string;
  priceInr: number;
}) {
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addToCart(restaurantSlug, menuItemName, qty, priceInr);
      alert("Added to cart");
      setQty(1);
    } catch {
      alert("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty === 1} className={styles.buttonSmall}>
        −
      </button>
      <span style={{ minWidth: "2rem", textAlign: "center" }}>{qty}</span>
      <button onClick={() => setQty(qty + 1)} className={styles.buttonSmall}>+</button>
      <button onClick={handleAdd} disabled={adding} className={styles.button}>
        Add
      </button>
    </div>
  );
}
