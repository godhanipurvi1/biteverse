"use client";

import { useState } from "react";
import { logout } from "../auth.api";

export function LogoutButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      await logout();
    } finally {
      window.location.assign("/");
    }
  }

  return (
    <button className={className} type="button" onClick={onClick} disabled={busy}>
      {busy ? "Logging out..." : "Log out"}
    </button>
  );
}
