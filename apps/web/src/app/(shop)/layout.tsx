import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopBar />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
