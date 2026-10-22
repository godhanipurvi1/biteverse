"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { getUser, clearSession, type AuthUser } from "../lib/auth";

type Props = {
  onNotify: (message: string) => void;
};

export default function UserMenu({ onNotify }: Props) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getUser());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function logout() {
    clearSession();
    setUser(null);
    setOpen(false);
    onNotify("You are logged out");
    window.location.href = "/";
  }

  if (!ready) return <div className="user" style={{ width: 120, height: 42 }} aria-hidden="true" />;

  if (!user) {
    return (
      <a className="userbtn" href="/login">
        <span className="avatar">?</span>
        <span className="nm">Log in</span>
      </a>
    );
  }

  const firstName = user.name.split(" ")[0];
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="user" ref={ref}>
      <button
        type="button"
        className="userbtn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar">{initial}</span>
        <span className="nm">{firstName}</span>
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="who">
            Signed in
            <b>{user.name}</b>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{user.email}</span>
          </div>
          <a role="menuitem" href="#top" onClick={() => setOpen(false)}>
            <Icon name="user" size={18} /> Profile
          </a>
          <a role="menuitem" href="#tracking" onClick={() => setOpen(false)}>
            <Icon name="receipt" size={18} /> My orders
          </a>
          <a role="menuitem" href="#restaurants" onClick={() => setOpen(false)}>
            <Icon name="heart" size={18} /> Favourites
          </a>
          <hr />
          <button type="button" role="menuitem" onClick={logout}>
            <Icon name="logout" size={18} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
