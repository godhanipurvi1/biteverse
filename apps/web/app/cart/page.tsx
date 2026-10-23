import type { Metadata } from "next";
import { CartView, type CartItem } from "./CartView";

export const metadata: Metadata = { title: "Cart" };

// Set to false once the cart store is connected.
const SHOW_DEMO = true;

const DEMO_ITEMS: CartItem[] = [
  { id: "1", name: "Gujarati Thali", restaurant: "Surti Locho House", pricePaise: 25000, qty: 1 },
  { id: "2", name: "Smash Burger", restaurant: "Patty Lane", pricePaise: 30000, qty: 2 },
];

export default function CartPage() {
  return (
    <>
      <h1 className="page-title">Your cart</h1>
      <CartView initialItems={SHOW_DEMO ? DEMO_ITEMS : []} />
    </>
  );
}
