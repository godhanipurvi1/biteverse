"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";

// Adjust these to match your admin menu routes.
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const LIST_URL = `${API}/api/admin/menu`;
const ITEMS_URL = (restaurantId: string) => `${API}/api/admin/menu/${restaurantId}/items`;
const ITEM_URL = (itemId: string) => `${API}/api/admin/menu/items/${itemId}`;

type MenuItem = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  pricePaise: number;
  isVeg?: boolean;
  isAvailable: boolean;
};

type Restaurant = {
  _id: string;
  name: string;
  menu: MenuItem[];
};

type FormState = {
  name: string;
  description: string;
  category: string;
  price: string;
  isVeg: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  category: "",
  price: "",
  isVeg: false,
};

export default function MenuView() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selected = useMemo(
    () => restaurants.find((r) => r._id === selectedId) ?? null,
    [restaurants, selectedId]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(LIST_URL, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Could not load menus");
      const list: Restaurant[] = data.restaurants ?? data;
      setRestaurants(list);
      setSelectedId((prev) => prev || list[0]?._id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(item: MenuItem) {
    setEditingId(item._id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      category: item.category ?? "",
      price: String(item.pricePaise / 100),
      isVeg: !!item.isVeg,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;

    const pricePaise = Math.round(Number(form.price) * 100);
    if (!form.name.trim() || !form.price.trim() || !Number.isFinite(pricePaise) || pricePaise < 0) {
      setError("Enter a dish name and a valid price.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(editingId ? ITEM_URL(editingId) : ITEMS_URL(selected._id), {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          isVeg: form.isVeg,
          pricePaise,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? `Save failed (${res.status})`);
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(item: MenuItem) {
    setError(null);
    try {
      const res = await fetch(ITEM_URL(item._id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      if (!res.ok) throw new Error("Could not update availability");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  if (loading) return <p style={styles.muted}>Loading menus…</p>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Menu</h1>

      {error && <div style={styles.error}>{error}</div>}

      {restaurants.length === 0 ? (
        <p style={styles.muted}>No restaurants found.</p>
      ) : (
        <>
          <label style={styles.label}>
            Restaurant
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                cancelEdit();
              }}
              style={styles.input}
            >
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <form onSubmit={handleSave} style={styles.form}>
            <h2 style={styles.h2}>{editingId ? "Edit dish" : "Add dish"}</h2>
            <div style={styles.row}>
              <input
                placeholder="Dish name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={styles.input}
              />
              <input
                placeholder="Price (₹)"
                required
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                style={styles.input}
              />
              <input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={styles.input}
              />
            </div>
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={styles.input}
            />
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={form.isVeg}
                onChange={(e) => setForm({ ...form, isVeg: e.target.checked })}
              />
              Vegetarian
            </label>
            <div style={styles.row}>
              <button type="submit" disabled={saving} style={styles.primaryBtn}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Add dish"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={styles.btn}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {selected && selected.menu.length === 0 ? (
            <p style={styles.muted}>No dishes yet for {selected.name}.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Dish</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {selected?.menu.map((item) => (
                  <tr key={item._id}>
                    <td style={styles.td}>
                      {item.isVeg && <span style={{ color: "green" }}>● </span>}
                      {item.name}
                    </td>
                    <td style={styles.td}>{item.category || "—"}</td>
                    <td style={styles.td}>₹{(item.pricePaise / 100).toFixed(2)}</td>
                    <td style={styles.td}>{item.isAvailable ? "Available" : "Unavailable"}</td>
                    <td style={styles.td}>
                      <button onClick={() => startEdit(item)} style={styles.btn}>
                        Edit
                      </button>{" "}
                      <button onClick={() => toggleAvailability(item)} style={styles.btn}>
                        {item.isAvailable ? "Mark unavailable" : "Mark available"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 16, padding: 24 },
  title: { fontSize: 24, fontWeight: 600, margin: 0 },
  h2: { fontSize: 16, fontWeight: 600, margin: 0 },
  label: { display: "flex", flexDirection: "column", gap: 6, maxWidth: 360 },
  form: { display: "flex", flexDirection: "column", gap: 10, padding: 16, border: "1px solid #ddd", borderRadius: 8 },
  row: { display: "flex", gap: 8, flexWrap: "wrap" },
  input: { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6, flex: "1 1 160px" },
  checkbox: { display: "flex", alignItems: "center", gap: 6 },
  btn: { padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6, background: "#fff", cursor: "pointer" },
  primaryBtn: { padding: "8px 14px", border: "none", borderRadius: 6, background: "#111", color: "#fff", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "8px", borderBottom: "1px solid #ddd", fontSize: 13 },
  td: { padding: "8px", borderBottom: "1px solid #eee", fontSize: 14 },
  error: { padding: 10, borderRadius: 6, background: "#fee", color: "#900" },
  muted: { color: "#666" },
};