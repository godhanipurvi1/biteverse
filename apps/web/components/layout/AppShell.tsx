"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className={`shell${drawerOpen ? " open" : ""}${collapsed ? " collapsed" : ""}`}>
      <Sidebar
        collapsed={collapsed}
        onNavigate={closeDrawer}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <div className="scrim" onClick={closeDrawer} aria-hidden="true" />
      <div className="main">
        <Topbar onMenu={() => setDrawerOpen((v) => !v)} menuOpen={drawerOpen} />
        <main id="main" className="gut">
          <div className="in">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
