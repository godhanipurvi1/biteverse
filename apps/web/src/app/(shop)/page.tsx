"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "@/features/home/home.module.css";
import anim from "@/features/home/animations/animations.module.css";
import { Reveal } from "@/features/home/animations/Reveal";
import { useSession } from "@/features/auth/use-session";

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const StoreIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M3 9l1.5-5h15L21 9" />
    <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    <path d="M5 12v8h14v-8" />
    <path d="M10 20v-5h4v5" />
  </svg>
);

const TagIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
);

const PinIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const features = [
  { title: "Restaurants", text: "Explore top-rated restaurants near you and discover new favorites.", href: "/restaurants", cta: "Browse Restaurants", icon: <StoreIcon /> },
  { title: "Offers", text: "Get the best deals, discounts and exclusive offers.", href: "/offers", cta: "View Offers", icon: <TagIcon /> },
  { title: "Live tracking", text: "Track your order in real-time and know exactly when it arrives.", href: "/order", cta: "Track Order", icon: <PinIcon /> },
];

export default function HomePage() {
  const { user, loading } = useSession();

  return (
    <>
      {user && !user.emailVerified && (
        <div className="container" style={{ paddingTop: "1rem" }}>
          <p>
            Your email isn&apos;t verified.{" "}
            <Link href="/verify-email">Verify it now</Link>.
          </p>
        </div>
      )}

      <section className={styles.hero} style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
        <Reveal variant="left">
          <div>
            <span className={styles.pill}>🍴 Good Food • Better Mood</span>
            <h1 className={styles.title}>
              Great food,
              <br />
              delivered to you
            </h1>
            <p className={styles.subtitle}>
              Discover your favorite restaurants, order delicious food, and enjoy fast &amp; reliable
              delivery, all in one place.
            </p>

            {user && (
              <Link href="/restaurants" className={styles.cta}>
                Browse Restaurants →
              </Link>
            )}
            {!user && !loading && (
              <>
                <Link href="/signup" className={styles.cta}>
                  Create an account
                </Link>
                <Link href="/login" className={styles.ctaOutline}>
                  Log in
                </Link>
              </>
            )}
          </div>
        </Reveal>

        <Reveal variant="right" delay={150}>
          <div className={anim.float}>
            <Image
              src="/images/hero-bowl.png"
              alt="Fresh bowl of chicken, avocado and salad"
              width={560}
              height={440}
              priority
              className={styles.heroImage}
            />
          </div>
        </Reveal>
      </section>

      <section className={styles.features}>
        {features.map((f, i) => (
          <Reveal key={f.title} variant="up" delay={200 + i * 120}>
            <article className={`${styles.card} ${anim.lift}`}>
              <span className={styles.tag}>Live</span>
              <div className={styles.iconWrap}>{f.icon}</div>
              <h2 className={styles.cardTitle}>{f.title}</h2>
              <p className={styles.cardText}>{f.text}</p>
              <Link href={f.href} className={styles.cardLink}>
                {f.cta} →
              </Link>
            </article>
          </Reveal>
        ))}
      </section>
    </>
  );
}