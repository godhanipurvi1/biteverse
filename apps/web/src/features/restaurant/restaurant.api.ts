export type MenuItem = {
  _id: string;
  name: string;
  description: string;
  priceInr: number;
  veg: boolean;
  available: boolean;
};

export type Restaurant = {
  _id: string;
  name: string;
  slug: string;
  cuisine: string[];
  city: string;
  rating: number;
  deliveryMinutes: number;
  isOpen: boolean;
  menu: MenuItem[];
};

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function getRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${API_URL}/api/restaurants`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { restaurants: Restaurant[] };
  return data.restaurants;
}

export async function getRestaurant(slug: string): Promise<Restaurant | null> {
  const res = await fetch(`${API_URL}/api/restaurants/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Could not load the restaurant");
  const data = (await res.json()) as { restaurant: Restaurant };
  return data.restaurant;
}
