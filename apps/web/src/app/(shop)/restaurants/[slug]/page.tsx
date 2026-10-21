"use client";
import { useState, useEffect } from "react";
import { getRestaurant } from "@/features/restaurant/restaurant.api";
import AddToCartButton from "@/features/orders/AddToCartButton";
import styles from "@/features/auth/auth.module.css";

export default function RestaurantDetailPage({ params }: { params: { slug: string } }) {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRestaurant(params.slug).then(setRestaurant).finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <div className={styles.page}>Loading...</div>;
  if (!restaurant) return <div className={styles.page}>Restaurant not found</div>;

  return (
    <div className={styles.page}>
      <h1>{restaurant.name}</h1>
      <p className={styles.muted}>{restaurant.cuisine.join(", ")} · {restaurant.deliveryMinutes} min</p>
      {restaurant.rating > 0 && <p>⭐ {restaurant.rating.toFixed(1)}</p>}

      <h2 style={{ marginTop: "2rem" }}>Menu</h2>
      {restaurant.menu.map((item: any) => (
        <div key={item.name} className={styles.card} style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div style={{ flex: 1 }}>
              <h3>{item.name}</h3>
              {item.description && <p className={styles.muted}>{item.description}</p>}
              <p>₹{(item.priceInr / 100).toFixed(2)}</p>
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
        </div>
      ))}
    </div>
  );
}
