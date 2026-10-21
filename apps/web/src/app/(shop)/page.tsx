import Link from "next/link";
import styles from "@/features/auth/auth.module.css";

const upcoming = [
  { title: "Restaurants", text: "Browse menus from places near you." },
  { title: "Offers", text: "Coupons and deals applied at checkout." },
  { title: "Live tracking", text: "Follow your order from kitchen to door." },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Great food, delivered to you</h1>
          <p>Create an account to get started.</p>
          <div className="hero__actions">
            <Link href="/signup" className={styles.button}>
              Create an account
            </Link>
            <Link href="/login" className={styles.buttonOutline}>
              Log in
            </Link>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="feature-grid">
          {upcoming.map((item) => (
            <article className="feature" key={item.title}>
              <span className="tag">Coming soon</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
