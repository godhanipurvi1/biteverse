import Link from "next/link";
import styles from "@/features/auth/auth.module.css";

export default function NotFound() {
  return (
    <section className="hero">
      <div className="container">
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist or has moved.</p>
        <div className="hero__actions">
          <Link href="/" className={styles.button}>
            Go home
          </Link>
        </div>
      </div>
    </section>
  );
}
