import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/features/auth/server-session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/account");
  return <>{children}</>;
}
