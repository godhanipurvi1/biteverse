"use client";
import { use, useState, useEffect } from "react";
import { getRestaurant } from "@/features/restaurant/restaurant.api";
import AddToCartButton from "@/features/orders/AddToCartButton";
import styles from "@/features/auth/auth.module.css";

type MenuItem = {
  _id?: string;
  name: string;
  description?: string;
  priceInr: number; // stored in paise
  available: boolean;
};

type Restaurant = {
  slug: string;
  name: string;
  cuisine?: string[];
  deliveryMinutes?: number;
  rating?: number | null;
  menu?: MenuItem[];
};

const formatPrice = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    getRestaurant(slug)
      .then((data) => {
        if (alive) setRestaurant(data);
      })
      .catch((err) => {
        console.error("Error fetching restaurant:", err);
        if (alive) setError("Restaurant not found");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) return <div className={styles.page}>Loading restaurant...</div>;
  if (error || !restaurant)
    return <div className={styles.page}>{error || "Restaurant not found"}</div>;

  const cuisine = restaurant.cuisine?.join(", ") ?? "";
  const menu = restaurant.menu ?? [];

  return (
    <div className={styles.page}>
      <h1>{restaurant.name}</h1>
      <p className={styles.muted}>
        {cuisine}
        {cuisine && restaurant.deliveryMinutes ? " · " : ""}
        {restaurant.deliveryMinutes ? `${restaurant.deliveryMinutes} min delivery` : ""}
      </p>
      {typeof restaurant.rating === "number" && restaurant.rating > 0 && (
        <p>⭐ {restaurant.rating.toFixed(1)}</p>
      )}

      <h2 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Menu</h2>
      {menu.length === 0 ? (
        <p className={styles.muted}>No menu items available</p>
      ) : (
        <div>
          {menu.map((item, index) => (
            <div
              key={item._id ?? `${item.name}-${index}`}
              className={styles.card}
              style={{
                marginBottom: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: "0.25rem" }}>{item.name}</h3>
                {item.description && (
                  <p className={styles.muted} style={{ marginBottom: "0.5rem" }}>
                    {item.description}
                  </p>
                )}
                <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                  {formatPrice(item.priceInr)}
                </p>
                {!item.available && (
                  <p className={styles.badgeWarn}>Out of stock</p>
                )}
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
