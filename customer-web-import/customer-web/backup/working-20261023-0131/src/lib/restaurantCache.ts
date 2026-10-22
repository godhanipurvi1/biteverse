// Keeps the restaurant list loaded on the home page, so opening a restaurant
// doesn't download the whole list again.
let cached: unknown[] | null = null;

export function setRestaurantCache(list: unknown[]) {
  cached = list;
}

export function getRestaurantCache<T>(): T[] | null {
  return cached as T[] | null;
}
