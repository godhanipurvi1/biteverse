"use client";

import { useState } from "react";
import Icon, { type IconName } from "./Icon";

type Item = { label: string; href: string; icon: IconName };

const ITEMS: Item[] = [
  { label: "Home", href: "#top", icon: "home" },
  { label: "Restaurants", href: "#restaurants", icon: "store" },
  { label: "Offers", href: "#offers", icon: "tag" },
  { label: "Live tracking", href: "#tracking", icon: "bike" },
];

type Props = {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, collapsed, onClose }: Props) {
  const [active, setActive] = useState("#top");

  return (
    <>
      <div className={`scrim ${open ? "show" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside
        className={`side ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}
        aria-label="Main menu"
      >
        <div className="side-head">
          <span className="side-title">Menu</span>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>
        <nav>
          {ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              title={item.label}
              className={active === item.href ? "on" : ""}
              aria-current={active === item.href ? "page" : undefined}
              onClick={() => {
                setActive(item.href);
                onClose();
              }}
            >
              <Icon name={item.icon} />
              <span className="lbl">{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="promo">
          <p>Hungry right now? Your last order can be tracked live.</p>
          <a href="#tracking">Track order</a>
          <span className="ring" aria-hidden="true" />
        </div>
      </aside>
    </>
  );
}
