"use client";
import { use, useState, useEffect } from "react";
import { getRestaurant } from "@/features/restaurant/restaurant.api";
import AddToCartButton from "@/features/orders/AddToCartButton";
import styles from "@/features/auth/auth.module.css";

export default function RestaurantDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getRestaurant(slug)
      .then(setRestaurant)
      .catch((err) => {
        console.error("Error fetching restaurant:", err);
        setError("Restaurant not found");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className={styles.page}>Loading restaurant...</div>;
  if (error || !restaurant) return <div className={styles.page}>{error || "Restaurant not found"}</div>;

  return (
    <div className={styles.page}>
      <h1>{restaurant.name}</h1>
      <p className={styles.muted}>
        {restaurant.cuisine.join(", ")} · {restaurant.deliveryMinutes} min delivery
      </p>
      {restaurant.rating > 0 && <p>⭐ {restaurant.rating.toFixed(1)}</p>}

      <h2 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Menu</h2>
      {!restaurant.menu || restaurant.menu.length === 0 ? (
        <p className={styles.muted}>No menu items available</p>
      ) : (
        <div>
          {restaurant.menu.map((item: any) => (
            <div key={item.name} className={styles.card} style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: "0.25rem" }}>{item.name}</h3>
                {item.description && <p className={styles.muted} style={{ marginBottom: "0.5rem" }}>{item.description}</p>}
                <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>₹{(item.priceInr / 100).toFixed(2)}</p>
                {!item.available && <p className={styles.badgeWarn}>Out of stock</p>}
              </div>
              {item.available && (
                <AddToCartButton
                  restaurantSlug={restaurant.slug}
                  menuItemName={item.name}
                  priceInr={item.priceInr}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
