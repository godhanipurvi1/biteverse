import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/features/auth/server-session";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
