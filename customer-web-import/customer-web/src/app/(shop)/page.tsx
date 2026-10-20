
"use client";

import { useEffect, useState } from "react";

type Restaurant = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  cuisine?: string | string[];
  cuisines?: string[];
  rating?: number | string;
  address?: string;
  location?: string;
  image?: string;
  imageUrl?: string;
  coverImage?: string;
  isOpen?: boolean;
  deliveryTime?: string;
  deliveryFee?: number | string;
};

type ApiResult = {
  status?: string;
  app?: string;
  message?: string;
};

type RestaurantApiResult = {
  success?: boolean;
  count?: number;
  data?: Restaurant[];
  message?: string;
};

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState("Checking backend...");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantStatus, setRestaurantStatus] = useState(
    "Loading restaurants..."
  );
  const [search, setSearch] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!apiUrl) {
      setApiStatus("API URL is not configured");
      setRestaurantStatus("Configure the API URL to load restaurants.");
      return;
    }

    async function loadData() {
      try {
        const healthResponse = await fetch(`${apiUrl}/api/health`);

        if (!healthResponse.ok) {
          throw new Error("Backend health check failed");
        }

        const healthData: ApiResult = await healthResponse.json();
        setApiStatus(
          healthData.status === "ok" || healthData.status === "success"
            ? "Backend connected successfully"
            : `Backend responded: ${healthData.status || "Available"}`
        );
      } catch {
        setApiStatus("Backend connection failed");
      }

      try {
        const response = await fetch(`${apiUrl}/api/restaurants`);

        if (!response.ok) {
          throw new Error("Could not fetch restaurants");
        }

        const result: RestaurantApiResult = await response.json();
        const restaurantList = Array.isArray(result)
          ? result
          : result.data;

        if (!Array.isArray(restaurantList)) {
          throw new Error(result.message || "Invalid restaurant response");
        }

        setRestaurants(restaurantList);
        setRestaurantStatus(
          restaurantList.length
            ? `${restaurantList.length} restaurants found`
            : "No restaurants are available yet."
        );
      } catch {
        setRestaurants([]);
        setRestaurantStatus(
          "Could not load restaurants. Check that the restaurant API is running."
        );
      }
    }

    loadData();
  }, [apiUrl]);

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const cuisineText = Array.isArray(restaurant.cuisine)
      ? restaurant.cuisine.join(" ")
      : restaurant.cuisine || "";

    const searchableText = [
      restaurant.name,
      restaurant.title,
      restaurant.description,
      cuisineText,
      ...(restaurant.cuisines || []),
      restaurant.address,
      restaurant.location,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.toLowerCase());
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 20px 60px",
        fontFamily: "Arial, sans-serif",
        background: "#fffaf5",
        color: "#1f2937",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <header style={{ marginBottom: "32px" }}>
          <p
            style={{
              color: "#ff6b00",
              fontWeight: 800,
              letterSpacing: "3px",
              marginBottom: "24px",
            }}
          >
            BITEVERSE
          </p>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              margin: "0 0 12px",
              lineHeight: 1.15,
            }}
          >
            Delicious food, delivered fast.
          </h1>

          <p style={{ color: "#6b7280", lineHeight: 1.7 }}>
            Discover your next favourite meal with BiteVerse.
          </p>
        </header>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "36px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Backend connection</h2>

          <p
            role="status"
            style={{
              color: apiStatus === "Backend connected successfully"
                ? "#15803d"
                : "#b45309",
              fontWeight: 700,
            }}
          >
            {apiStatus === "Backend connected successfully" ? "✓ " : "• "}
            {apiStatus}
          </p>

          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            API URL: {apiUrl || "Not configured"}
          </p>
        </section>

        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: "28px" }}>
                Restaurants near you
              </h2>
              <p style={{ margin: 0, color: "#6b7280" }}>
                Discover restaurants available on BiteVerse.
              </p>
            </div>

            <input
              type="search"
              placeholder="Search restaurants..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search restaurants"
              style={{
                padding: "13px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                width: "min(100%, 280px)",
                fontSize: "15px",
                outlineColor: "#ff6b00",
              }}
            />
          </div>

          <p role="status" style={{ color: "#6b7280" }}>
            {restaurantStatus}
          </p>

          {filteredRestaurants.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "22px",
                marginTop: "20px",
              }}
            >
              {filteredRestaurants.map((restaurant, index) => {
                const name =
                  restaurant.name || restaurant.title || "Restaurant";

                const cuisine = Array.isArray(restaurant.cuisine)
                  ? restaurant.cuisine.join(", ")
                  : restaurant.cuisine ||
                    restaurant.cuisines?.join(", ") ||
                    "Cuisine details unavailable";

                const image =
                  restaurant.imageUrl ||
                  restaurant.image ||
                  restaurant.coverImage;

                return (
                  <article
                    key={restaurant._id || restaurant.id || `${name}-${index}`}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "18px",
                      overflow: "hidden",
                      boxShadow: "0 5px 18px rgba(31, 41, 55, 0.05)",
                    }}
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        style={{
                          width: "100%",
                          height: "190px",
                          objectFit: "cover",
                          display: "block",
                          background: "#f3f4f6",
                        }}
                      />
                    ) : (
                      <div
                        aria-label={`${name} image placeholder`}
                        style={{
                          height: "150px",
                          display: "grid",
                          placeItems: "center",
                          background: "#fff0e5",
                          color: "#ff6b00",
                          fontSize: "42px",
                          fontWeight: 800,
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div style={{ padding: "20px" }}>
                      <h3 style={{ fontSize: "21px", margin: "0 0 10px" }}>
                        {name}
                      </h3>

                      <p style={{ color: "#6b7280", margin: "0 0 12px" }}>
                        {cuisine}
                      </p>

                      {restaurant.description && (
                        <p style={{ lineHeight: 1.6, color: "#4b5563" }}>
                          {restaurant.description}
                        </p>
                      )}

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "12px",
                          alignItems: "center",
                          marginTop: "12px",
                          fontSize: "14px",
                        }}
                      >
                        {restaurant.rating !== undefined && (
                          <span
                            style={{
                              background: "#f0fdf4",
                              color: "#166534",
                              padding: "6px 9px",
                              borderRadius: "8px",
                              fontWeight: 700,
                            }}
                          >
                            ★ {restaurant.rating}
                          </span>
                        )}

                        {restaurant.deliveryTime && (
                          <span style={{ color: "#6b7280" }}>
                            {restaurant.deliveryTime}
                          </span>
                        )}

                        {restaurant.isOpen !== undefined && (
                          <span
                            style={{
                              color: restaurant.isOpen
                                ? "#15803d"
                                : "#b91c1c",
                              fontWeight: 600,
                            }}
                          >
                            {restaurant.isOpen ? "Open" : "Closed"}
                          </span>
                        )}
                      </div>

                      {(restaurant.address || restaurant.location) && (
                        <p
                          style={{
                            color: "#6b7280",
                            fontSize: "14px",
                            lineHeight: 1.5,
                            marginBottom: 0,
                          }}
                        >
                          {restaurant.address || restaurant.location}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            restaurants.length > 0 &&
            search.trim() !== "" && (
              <p style={{ color: "#6b7280" }}>
                No restaurants match &quot;{search}&quot;.
              </p>
            )
          )}
        </section>
      </div>
    </main>
  );
}
