const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Request failed: ${res.status}`);
  }

  return data;
}

// Anonymous per-browser id, used as the "userId" for cart/favorites/orders
// until real authentication is added. Persisted in localStorage.
export function getGuestId() {
  let id = localStorage.getItem("biteverse_guest_id");
  if (!id) {
    id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("biteverse_guest_id", id);
  }
  return id;
}

export const api = {
  // Restaurants
  getRestaurants: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/restaurants${qs ? `?${qs}` : ""}`);
  },
  getRestaurant: (id) => request(`/restaurants/${id}`),
  getOffers: () => request(`/restaurants/offers`),

  // Cart
  getCart: (userId) => request(`/cart/${userId}`),
  addToCart: (userId, item) =>
    request(`/cart/${userId}`, { method: "POST", body: JSON.stringify(item) }),
  updateCartItem: (userId, itemId, qty) =>
    request(`/cart/${userId}/${itemId}`, { method: "PUT", body: JSON.stringify({ qty }) }),
  removeCartItem: (userId, itemId) =>
    request(`/cart/${userId}/${itemId}`, { method: "DELETE" }),
  clearCart: (userId) => request(`/cart/${userId}`, { method: "DELETE" }),

  // Favorites
  getFavorites: (userId) => request(`/favorites/${userId}`),
  addFavorite: (userId, restaurantId) =>
    request(`/favorites/${userId}`, { method: "POST", body: JSON.stringify({ restaurantId }) }),
  removeFavorite: (userId, restaurantId) =>
    request(`/favorites/${userId}/${restaurantId}`, { method: "DELETE" }),

  // Orders
  placeOrder: (payload) => request(`/orders`, { method: "POST", body: JSON.stringify(payload) }),
  getOrders: (userId) => request(`/orders/${userId}`),
  getOrder: (userId, orderId) => request(`/orders/${userId}/${orderId}`),

  // Contact
  sendContact: (payload) => request(`/contact`, { method: "POST", body: JSON.stringify(payload) }),
};