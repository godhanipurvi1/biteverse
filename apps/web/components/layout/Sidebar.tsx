"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../ui/Icon";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/restaurants", label: "Restaurants", icon: "store" },
  { href: "/offers", label: "Offers", icon: "tag" },
  { href: "/orders", label: "Orders", icon: "receipt" },
  { href: "/favourites", label: "Favourites", icon: "heart" },
  { href: "/cart", label: "Cart", icon: "cart" },
];

type Props = {
  collapsed: boolean;
  onNavigate: () => void;
  onToggleCollapse: () => void;
};

export function Sidebar({ collapsed, onNavigate, onToggleCollapse }: Props) {
  const pathname = usePathname();

  return (
    <aside id="side-nav" className="side" aria-label="Main">
      <div className="head">
        <Link href="/" className="logo" onClick={onNavigate}>
          Bite<b>Verse</b>
        </Link>
        <button type="button" className="iconbtn close-btn" onClick={onNavigate} aria-label="Close menu">
          <Icon name="close" />
        </button>
      </div>

      <div>
        <h4 className="side-label">Browse</h4>
        <nav className="nav">
          {NAV.map((item) => {
            const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={item.label}
                aria-current={current ? "page" : undefined}
              >
                <Icon name={item.icon} />
                <span className="nav-text">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="promo">
        <p>Hungry? Today&apos;s offers are waiting.</p>
        <Link href="/offers">See offers</Link>
      </div>

      <button
        type="button"
        className="iconbtn collapse-btn"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
      >
        <Icon name="chevron" />
      </button>
    </aside>
  );
}
