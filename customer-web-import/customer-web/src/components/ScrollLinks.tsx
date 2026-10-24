"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Words to find a section by its heading when it has no id.
const HEADING_WORDS: Record<string, string> = {
  restaurants: "restaurant",
  offers: "offer",
  tracking: "track",
  help: "help",
};

function findTarget(id: string): Element | null {
  if (id === "" || id === "top") return document.body;
  const byId = document.getElementById(id);
  if (byId) return byId;
  const word = (HEADING_WORDS[id] ?? id).toLowerCase();
  const heading = Array.from(document.querySelectorAll("h1, h2, h3")).find((el) =>
    (el.textContent ?? "").toLowerCase().includes(word)
  );
  return heading ? heading.closest("section") ?? heading : null;
}

function scrollToId(id: string): boolean {
  const el = findTarget(id);
  if (!el) return false;
  if (el === document.body) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return true;
}

export default function ScrollLinks() {
  const pathname = usePathname();

  // Clicks on "/#section" links scroll on the home page.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (!href.startsWith("/#")) return;
      if (window.location.pathname !== "/") return; // other pages navigate normally
      e.preventDefault();
      const id = href.slice(2);
      scrollToId(id);
      window.history.replaceState(null, "", id ? `/#${id}` : "/");
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // When arriving at "/#section" from another page, scroll once the page has rendered.
  useEffect(() => {
    if (pathname !== "/") return;
    const id = window.location.hash.slice(1);
    if (!id) return;
    const t = window.setTimeout(() => scrollToId(id), 400);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return null;
}