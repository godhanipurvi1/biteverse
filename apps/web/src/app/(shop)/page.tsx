"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "@/features/auth/auth.module.css";
import { useSession } from "@/features/auth/use-session";

export default function HomePage() {
  const { user, loading } = useSession();

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Great food, delivered to you</h1>
          <p>{user ? `Welcome, ${user.name}!` : "Create an account to get started."}</p>
          <div className="hero__actions">
            {!user && !loading && (
              <>
                <Link href="/signup" className={styles.button}>
                  Create an account
                </Link>
                <Link href="/login" className={styles.buttonOutline}>
                  Log in
                </Link>
              </>
            )}
            {user && (
              <Link href="/restaurants" className={styles.button}>
                Browse Restaurants
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="container">
        <div className="feature-grid">
          <article className="feature">
            <span className="tag">Live</span>
            <h2>Restaurants</h2>
            <p>Browse menus from places near you.</p>
            <Link href="/restaurants" style={{ marginTop: "1rem" }}>
              Order now →
            </Link>
          </article>
          <article className="feature">
            <span className="tag">Coming soon</span>
            <h2>Offers</h2>
            <p>Coupons and deals applied at checkout.</p>
          </article>
          <article className="feature">
            <span className="tag">Coming soon</span>
            <h2>Live tracking</h2>
            <p>Follow your order from kitchen to door.</p>
          </article>
        </div>
      </section>
    </>
  );
}
