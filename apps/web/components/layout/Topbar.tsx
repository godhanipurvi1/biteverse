"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "../ui/Icon";

type Props = {
  onMenu: () => void;
  menuOpen: boolean;
  cartCount?: number;
};

export function Topbar({ onMenu, menuOpen, cartCount = 0 }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/restaurants?q=${encodeURIComponent(term)}` : "/restaurants");
  }

  return (
    <header className="topbar">
      <div className="topbar-row gut">
        <button
          type="button"
          className="iconbtn"
          onClick={onMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="side-nav"
        >
          <Icon name={menuOpen ? "close" : "menu"} />
        </button>

        <Link href="/" className="logo" aria-label="BiteVerse home">
          Bite<b>Verse</b>
        </Link>

        <form role="search" className="tsearch" onSubmit={onSearch}>
          <Icon name="search" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search restaurants or cuisines"
            aria-label="Search restaurants or cuisines"
          />
        </form>

        <div className="spacer" />

        <Link href="/offers" className="tlink">Offers</Link>
        <Link href="/orders" className="tlink">Orders</Link>

        <Link href="/cart" className="iconbtn" aria-label={`Cart, ${cartCount} items`}>
          <Icon name="cart" />
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </Link>

        <Link href="/account" className="iconbtn" aria-label="Account">
          <span className="avatar">
            <Icon name="user" />
          </span>
        </Link>
      </div>
    </header>
  );
}
