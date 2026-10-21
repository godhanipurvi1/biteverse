"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import UserMenu from "./UserMenu";

type Props = {
  onMenu: () => void;
  cartCount: number;
  onNotify: (message: string) => void;
  onOpenCart: () => void;
};

export default function TopBar({ onMenu, cartCount, onNotify, onOpenCart }: Props) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }

  return (
    <header className="topbar">
      <div className="topbar-row topbar-wide">
        <button type="button" className="iconbtn" onClick={onMenu} aria-label="Open menu">
          <Icon name="menu" />
        </button>
        <a href="#top" className="logo">
          Bite<b>Verse</b>
        </a>
        <span className="loc">
          <Icon name="pin" size={18} /> Deliver to <strong>Surat</strong>
        </span>
        <span className="spacer" />
        <a href="#offers" className="tlink">
          <Icon name="tag" size={18} /> Offers
        </a>
        <a href="#tracking" className="tlink">
          <Icon name="bike" size={18} /> Track order
        </a>
        <button type="button" className="iconbtn" onClick={toggleTheme} aria-label="Toggle light and dark theme">
          <Icon name={dark ? "sun" : "moon"} />
        </button>
        <button type="button" className="iconbtn" aria-label={`Cart, ${cartCount} items`} onClick={onOpenCart}>
          <Icon name="cart" />
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </button>
        <UserMenu onNotify={onNotify} />
      </div>
    </header>
  );
}
