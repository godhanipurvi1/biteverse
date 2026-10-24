import Link from "next/link";
import Shell from "../../components/Shell";
import styles from "./help.module.css";

// Change this to your real support address.
const SUPPORT_EMAIL = "support@biteverse.example";

const STEPS = [
  {
    title: "Choose a restaurant",
    body: "Search by name or pick a cuisine, then fill your cart.",
  },
  {
    title: "Pay and place",
    body: "Apply a coupon and pay by UPI, card or cash on delivery.",
  },
  {
    title: "Track to your door",
    body: "Follow your rider live and get notified when they arrive.",
  },
];

const FAQS = [
  {
    q: "How do I track my order?",
    a: "Open My orders from the sidebar, or use Track order on the orange card. Your order status updates as the restaurant confirms, prepares and dispatches it.",
  },
  {
    q: "How do I use a coupon?",
    a: "Go to your cart, enter the code in the Offers box, and tap Apply. Copy any code from the Offers page and paste it there. Each code has a minimum order amount.",
  },
  {
    q: "What payment methods can I use?",
    a: "You can pay by UPI, credit or debit card, or cash on delivery. Cash on delivery is available for orders up to ₹2,000.",
  },
  {
    q: "When is delivery free?",
    a: "Delivery is free on orders of ₹249 or more from a single restaurant. Below that, a small delivery fee applies.",
  },
  {
    q: "Can I reorder a previous order?",
    a: "Yes. Open My orders, find the order, and tap Reorder. The items are added to your cart.",
  },
  {
    q: "My order has a problem. What should I do?",
    a: "Contact support with your order ID, which starts with BV-. Include a short description of the issue so we can help quickly.",
  },
];

export default function HelpPage() {
  return (
    <Shell showFooter>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h1 className={styles.title}>How it works</h1>
          <p className={styles.sub}>Three steps from hungry to happy.</p>
        </header>

        <section className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={s.title} className={styles.step}>
              <div className={styles.stepNum}>{i + 1}</div>
              <h2 className={styles.stepTitle}>{s.title}</h2>
              <p className={styles.stepBody}>{s.body}</p>
            </div>
          ))}
        </section>

        <div className={styles.twoCol}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Frequently asked questions</h2>
            {FAQS.map((f) => (
              <details key={f.q} className={styles.faq}>
                <summary className={styles.question}>{f.q}</summary>
                <p className={styles.answer}>{f.a}</p>
              </details>
            ))}
          </section>

          <aside className={styles.side}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Need more help?</h2>
              <p className={styles.muted}>
                Our support team can help with orders, payments and refunds.
              </p>
              <a className={styles.primaryBtn} href={`mailto:${SUPPORT_EMAIL}`}>
                Email support
              </a>
              <p className={styles.small}>{SUPPORT_EMAIL}</p>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Quick links</h2>
              <nav className={styles.links}>
                <Link href="/orders">Track or reorder</Link>
                <Link href="/offers">Today&apos;s offers</Link>
                <Link href="/cart">Your cart</Link>
                <Link href="/favourites">Favourites</Link>
              </nav>
            </section>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
