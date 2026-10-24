"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Footer from "./Footer";
import { useCart, cartCountOf } from "../lib/cart";

type Props = {
  children: ReactNode;
  onNotify?: (message: string) => void;
  onOpenCart?: () => void;
  hideFooter?: boolean;
  showFooter?: boolean;
};

export default function Shell({ children, onNotify, onOpenCart, hideFooter, showFooter }: Props) {
  const router = useRouter();
  const cart = useCart();
  const cartCount = cartCountOf(cart);
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  function onMenu() {
    if (typeof window !== "undefined" && window.innerWidth < 900) setNavOpen(true);
    else setCollapsed((c) => !c);
  }

  return (
    <>
      <TopBar
        onMenu={onMenu}
        cartCount={cartCount}
        onNotify={onNotify ?? (() => {})}
        onOpenCart={onOpenCart ?? (() => router.push("/cart"))}
      />
      <div className={`shell ${collapsed ? "collapsed" : ""}`}>
        <Sidebar open={navOpen} collapsed={collapsed} onClose={() => setNavOpen(false)} cartCount={cartCount} />
        <main className="main container">{children}</main>
        {showFooter && <Footer />}
      </div>
    </>
  );
}
