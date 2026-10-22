"use client";

import Icon from "./Icon";
import { useCart, addToCart, changeQty } from "../lib/cart";

type MenuItem = { _id: string; name: string; price: number; description?: string; veg?: boolean };
type Restaurant = { _id: string; name: string; menu?: MenuItem[] };

type Props = {
  restaurant: Restaurant | null;
  onClose: () => void;
  onToast?: (message: string) => void;
};

function dishSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function MenuSheet({ restaurant, onClose, onToast }: Props) {
  const cart = useCart();
  const open = restaurant !== null;
  const items = (restaurant?.menu ?? []).filter((m) => typeof m.price === "number" && m.price > 0);
  const qtyOf = (id: string) => cart?.lines.find((l) => l.id === id)?.qty ?? 0;

  function add(m: MenuItem) {
    if (!restaurant) return;
    if (addToCart(restaurant, m)) onToast?.(`Added ${m.name}`);
  }

  return (
    <>
      <div className={`scrim ${open ? "show" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sheet ${open ? "open" : ""}`} aria-label={restaurant ? `${restaurant.name} menu` : "Menu"}>
        <div className="cart-head">
          <h2>{restaurant?.name ?? "Menu"}</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>
        {items.length === 0 ? (
          <p className="meta">Menu not available yet.</p>
        ) : (
          <ul className="menu-list">
            {items.map((m) => {
              const q = qtyOf(m._id);
              return (
                <li key={m._id} className="menu-item">
                  <img
                    className="dish-photo"
                    src={`/images/menu/${dishSlug(m.name)}.jpg`}
                    alt=""
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <div>
                    {typeof m.veg === "boolean" && (<span className={`vdot ${m.veg ? "veg" : "nonveg"}`} title={m.veg ? "Veg" : "Non-veg"} aria-label={m.veg ? "Veg" : "Non-veg"} />)}<strong>{m.name}</strong>
                    <span className="meta">{"\u20B9"}{m.price}</span>
                  </div>
                  {q === 0 ? (
                    <button type="button" className="add-small" onClick={() => add(m)}>
                      Add
                    </button>
                  ) : (
                    <div className="qty">
                      <button type="button" onClick={() => changeQty(m._id, -1)} aria-label={`Remove one ${m.name}`}>-</button>
                      <span aria-live="polite">{q}</span>
                      <button type="button" onClick={() => add(m)} aria-label={`Add one ${m.name}`}>+</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </>
  );
}
