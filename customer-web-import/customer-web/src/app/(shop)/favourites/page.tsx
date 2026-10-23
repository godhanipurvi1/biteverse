"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Footer from "../../../components/Footer";
import TopBar from "../../../components/TopBar";
import Sidebar from "../../../components/Sidebar";
import { API_URL, AuthError } from "../../../lib/orders";
import { fetchFavorites, setFavorite, type FavoriteRestaurant } from "../../../lib/favorites";
import { useCart, cartCountOf } from "../../../lib/cart";
import styles from "./favourites.module.css";

type Row = FavoriteRestaurant & Record<string, unknown>;

function cuisineText(r: Row): string {
  const c = r.cuisines ?? r.cuisine;
  if (Array.isArray(c)) return c.join(", ");
  return typeof c === "string" ? c : "";
}

function imageOf(r: Row): string | null {
  const img = r.image ?? r.imageUrl;
  if (typeof img !== "string" || !img) return null;
  return img.startsWith("http") || img.startsWith("/") ? img : `${API_URL}/${img}`;
}

export default function FavouritesPage() {
  const router = useRouter();
  const cart = useCart();
  const cartCount = cartCountOf(cart);

  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites()
      .then((list) => setItems(list as Row[]))
      .catch((e) => setError(e instanceof AuthError ? "Log in to see your favourites." : (e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function unfavourite(id: string) {
    const before = items;
    setItems((cur) => cur.filter((r) => String(r._id) !== id));
    try {
      await setFavorite(id, false);
    } catch (e) {
      setItems(before);
      setError((e as Error).message);
    }
  }

  function onMenu() {
    if (typeof window !== "undefined" && window.innerWidth < 900) setNavOpen(true);
    else setCollapsed((c) => !c);
  }

  return (
    <>
      <TopBar onMenu={onMenu} cartCount={cartCount} onNotify={() => {}} onOpenCart={() => router.push("/cart")} />

      <div className={`shell ${collapsed ? "collapsed" : ""}`}>
        <Sidebar open={navOpen} collapsed={collapsed} onClose={() => setNavOpen(false)} cartCount={cartCount} />

        <main className="main container">
          <div className={styles.page}>
            <h1 className={styles.title}>Your favourites</h1>
            <p className={styles.subtitle}>Restaurants and dishes you saved. Tap the heart again to remove one.</p>

            {error && <p className={styles.error}>{error}</p>}

            <section className={styles.section}>
              <h2 className={styles.heading}>
                Restaurants <span className={styles.count}>{loading ? "" : items.length}</span>
              </h2>

              {!loading && items.length === 0 && (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>&#9825;</div>
                  <p>No favourite restaurants yet. Tap the heart on a restaurant to save it here.</p>
                  <Link href="/#restaurants" className={styles.primaryBtn}>Browse restaurants</Link>
                </div>
              )}

              {items.length > 0 && (
                <div className={styles.grid}>
                  {items.map((r) => {
                    const img = imageOf(r);
                    const rating = typeof r.rating === "number" ? r.rating.toFixed(1) : null;
                    const time = typeof r.deliveryTime === "string" ? r.deliveryTime : null;
                    const price = typeof r.priceForTwo === "number" ? `₹${r.priceForTwo} for two` : null;
                    const offer = typeof r.offer === "string" ? r.offer : null;
                    return (
                      <article key={String(r._id)} className={styles.card}>
                        <div className={styles.art}>
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt={r.name} className={styles.img} />
                          ) : (
                            <div className={styles.letter}>{r.name.charAt(0)}</div>
                          )}
                          {offer && <span className={styles.badge}>{offer}</span>}
                          <button
                            className={styles.heart}
                            aria-label="Remove from favourites"
                            onClick={() => unfavourite(String(r._id))}
                          >
                            &#10084;
                          </button>
                        </div>
                        <div className={styles.body}>
                          <h3 className={styles.name}>{r.name}</h3>
                          <p className={styles.cuisine}>{cuisineText(r)}</p>
                          <div className={styles.meta}>
                            {rating && <span>&#9733; {rating}</span>}
                            {time && <span>{time}</span>}
                            {price && <span>{price}</span>}
                          </div>
                          <Link href={`/menu?restaurant=${r._id}`} className={styles.outlineBtn}>View menu</Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.heading}>
                Dishes <span className={styles.count}>0</span>
              </h2>
              <div className={styles.empty}>
                <p>No favourite dishes yet. Open a menu and tap the heart on a dish to save it.</p>
                <Link href="/menu" className={styles.outlineBtn}>Open a menu</Link>
              </div>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}