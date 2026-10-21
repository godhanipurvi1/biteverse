"use client";

import { useEffect } from "react";

type Props = {
  message: string | null;
  onDone: () => void;
};

export default function Toast({ message, onDone }: Props) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div className={`toast ${message ? "show" : ""}`} role="status" aria-live="polite">
      {message ?? ""}
    </div>
  );
}
