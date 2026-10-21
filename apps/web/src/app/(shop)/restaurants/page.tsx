"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "@/features/auth/auth.module.css";
import { getRestaurants } from "@/features/restaurant/restaurant.api";
import { RestaurantCard } from "@/features/restaurant/RestaurantCard";

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getRestaurants()
      .then(setRestaurants)
      .catch((err) => {
        console.error("Error fetching restaurants:", err);
        setError("Failed to load restaurants");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <section className={styles.page}>Loading restaurants...</section>;
  if (error) return <section className={styles.page}>{error}</section>;

  return (
    <section className={styles.pageWide}>
      <div className={styles.panelHeader}>
        <div>
          <h1>Restaurants</h1>
          <p className={styles.muted}>{restaurants.length} places near you</p>
        </div>
        <Link href="/" className={styles.buttonOutline}>
          Home
        </Link>
      </div>

      {restaurants.length === 0 ? (
        <p className={styles.muted}>No restaurants yet. Check back soon.</p>
      ) : (
        <div className="feature-grid">
          {restaurants.map((r) => (
            <RestaurantCard key={r._id} restaurant={r} />
          ))}
        </div>
      )}
    </section>
  );
}
