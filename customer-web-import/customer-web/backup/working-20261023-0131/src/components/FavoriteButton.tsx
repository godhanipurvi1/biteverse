"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthError } from "../lib/orders";
import { setFavorite } from "../lib/favorites";
import styles from "./FavoriteButton.module.css";

type Props = { restaurantId: string; initial?: boolean };

export default function FavoriteButton({ restaurantId, initial = false }: Props) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      await setFavorite(restaurantId, !on);
      setOn(!on);
    } catch (err) {
      if (err instanceof AuthError) setNeedsLogin(true);
      else setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (needsLogin) {
    return (
      <Link href="/login" className={styles.link}>
        Log in to save favorites
      </Link>
    );
  }

  return (
    <span className={styles.wrap}>
      <button
        type="button"
        className={styles.button}
        aria-pressed={on}
        disabled={busy}
        onClick={toggle}
      >
        {on ? "Saved" : "Save"}
      </button>
      {error && <span className={styles.error} role="alert">{error}</span>}
    </span>
  );
}