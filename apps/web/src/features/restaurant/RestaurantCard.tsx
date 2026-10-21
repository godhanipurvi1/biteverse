import Link from "next/link";
import styles from "@/features/auth/auth.module.css";
import type { Restaurant } from "./restaurant.api";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link href={`/restaurants/${restaurant.slug}`} className="feature" style={{ display: "block" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <h2 style={{ fontSize: "var(--text-lg)" }}>{restaurant.name}</h2>
        <span className="rating">★ {restaurant.rating.toFixed(1)}</span>
      </div>
      <p style={{ margin: "var(--space-2) 0" }}>{restaurant.cuisine.join(" · ")}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
          {restaurant.deliveryMinutes} min · {restaurant.city}
        </span>
        <span className={`${styles.badge} ${restaurant.isOpen ? styles.badgeOk : styles.badgeWarn}`}>
          {restaurant.isOpen ? "Open" : "Closed"}
        </span>
      </div>
    </Link>
  );
}
