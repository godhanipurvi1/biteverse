import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getServerUser } from "@/features/auth/server-session";
import { AdminShell } from "@/features/admin/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/account");

  return (
    <AdminShell name={user.name} role={user.role}>
      {children}
    </AdminShell>
  );
}