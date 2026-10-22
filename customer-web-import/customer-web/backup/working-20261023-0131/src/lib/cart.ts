"use client";

import { useSyncExternalStore } from "react";

export type CartLine = { id: string; name: string; price: number; qty: number; restaurantId: string; restaurantName: string };
export type Cart = { lines: CartLine[] };

const KEY = "biteverse-cart";
const listeners = new Set<() => void>();
let snapshot: Cart | null = null;
let loaded = false;

function readStorage(): Cart | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cart;
    const ok = Array.isArray(parsed?.lines) && parsed.lines.every((l) => typeof l.restaurantId === "string");
    return ok && parsed.lines.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function getSnapshot(): Cart | null {
  if (!loaded) {
    snapshot = readStorage();
    loaded = true;
  }
  return snapshot;
}

function getServerSnapshot(): Cart | null {
  return null;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = () => {
    snapshot = readStorage();
    loaded = true;
    callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveCart(next: Cart | null) {
  snapshot = next;
  loaded = true;
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable: the cart still works until the page is refreshed.
  }
  emit();
}

export function useCart(): Cart | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function cartCountOf(cart: Cart | null): number {
  return cart ? cart.lines.reduce((n, l) => n + l.qty, 0) : 0;
}

export function cartSubtotalOf(cart: Cart | null): number {
  return cart ? cart.lines.reduce((n, l) => n + l.qty * l.price, 0) : 0;
}

// Delivery is free at Rs 249 or more; otherwise Rs 40. Change here if the rule differs.
export function deliveryFeeFor(subtotal: number): number {
  return subtotal === 0 || subtotal >= 249 ? 0 : 40;
}

export type RestaurantGroup = { restaurantId: string; restaurantName: string; lines: CartLine[]; subtotal: number; fee: number };

// Splits the cart by restaurant. Each group gets its own subtotal and delivery fee.
export function groupByRestaurant(cart: Cart | null): RestaurantGroup[] {
  const groups: RestaurantGroup[] = [];
  for (const l of cart?.lines ?? []) {
    let g = groups.find((x) => x.restaurantId === l.restaurantId);
    if (!g) {
      g = { restaurantId: l.restaurantId, restaurantName: l.restaurantName, lines: [], subtotal: 0, fee: 0 };
      groups.push(g);
    }
    g.lines.push(l);
    g.subtotal += l.qty * l.price;
  }
  for (const g of groups) g.fee = deliveryFeeFor(g.subtotal);
  return groups;
}

export function cartDeliveryFeeOf(cart: Cart | null): number {
  return groupByRestaurant(cart).reduce((n, g) => n + g.fee, 0);
}

type MenuItemLike = { _id: string; name: string; price: number };
type RestaurantLike = { _id: string; name: string };

// Always succeeds: a cart can hold items from several restaurants.
export function addToCart(r: RestaurantLike, item: MenuItemLike): boolean {
  const current = getSnapshot();
  const lines: CartLine[] = current ? [...current.lines] : [];
  const idx = lines.findIndex((l) => l.id === item._id && l.restaurantId === r._id);
  if (idx >= 0) lines[idx] = { ...lines[idx], qty: lines[idx].qty + 1 };
  else lines.push({ id: item._id, name: item.name, price: item.price, qty: 1, restaurantId: r._id, restaurantName: r.name });
  saveCart({ lines });
  return true;
}

export function changeQty(itemId: string, delta: number) {
  const current = getSnapshot();
  if (!current) return;
  const lines = current.lines
    .map((l) => (l.id === itemId ? { ...l, qty: l.qty + delta } : l))
    .filter((l) => l.qty > 0);
  saveCart(lines.length ? { ...current, lines } : null);
}

export function removeLine(itemId: string) {
  const current = getSnapshot();
  if (!current) return;
  const lines = current.lines.filter((l) => l.id !== itemId);
  saveCart(lines.length ? { ...current, lines } : null);
}
