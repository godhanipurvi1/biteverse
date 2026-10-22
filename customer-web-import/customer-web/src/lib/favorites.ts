// src/lib/favorites.ts
import { API_URL, AuthError, TOKEN_KEY } from "./orders";

export type FavoriteRestaurant = {
  _id: string;
  name: string;
  cuisine?: string;
  [key: string]: unknown;
};

function authHeaders(): Record<string, string> {
  const token = window.localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function call(path: string, init: RequestInit = {}) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...authHeaders() },
      cache: "no-store",
    });
  } catch {
    throw new Error("Cannot reach the server. Check that the backend is running.");
  }
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) throw new AuthError("Log in to use favorites.");
  if (!res.ok) throw new Error(json.message ?? "Something went wrong. Try again.");
  return json;
}

export async function fetchFavorites(): Promise<FavoriteRestaurant[]> {
  const json = await call("/api/favorites");
  return json.data ?? [];
}

export async function setFavorite(restaurantId: string, on: boolean): Promise<void> {
  await call(`/api/favorites/${restaurantId}`, { method: on ? "POST" : "DELETE" });
}