import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getGuestId } from "../api/client";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = getGuestId();

  const refreshFavorites = useCallback(async () => {
    try {
      const data = await api.getFavorites(userId);
      setFavorites(data);
    } catch (err) {
      console.error("Failed to load favorites:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = (restaurantId) => favorites.some((r) => r.id === restaurantId);

  const toggleFavorite = async (restaurantId) => {
    if (isFavorite(restaurantId)) {
      await api.removeFavorite(userId, restaurantId);
    } else {
      await api.addFavorite(userId, restaurantId);
    }
    await refreshFavorites();
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, loading, isFavorite, toggleFavorite, refreshFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside a <FavoritesProvider>");
  return ctx;
}