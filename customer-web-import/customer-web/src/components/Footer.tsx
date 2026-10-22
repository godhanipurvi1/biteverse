import Link from 'next/link';
import styles from './footer.module.css';

type FooterLink = { label: string; href: string };
type Column = { title: string; links: FooterLink[] };

// href '#' = no page yet. Replace with the real route when it exists.
const COLUMNS: Column[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Restaurants', href: '/' },
      { label: 'Offers', href: '#' },
      { label: 'Live tracking', href: '#' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Profile', href: '#' },
      { label: 'My orders', href: '#' },
      { label: 'Favourites', href: '#' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'How it works', href: '#' },
      { label: 'Contact support', href: '#' },
      { label: 'Refund policy', href: '#' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              Bite<span>Verse</span>
            </Link>
            <p className={styles.tagline}>
              Good food, better mood. Order from your favourite local kitchens and track every delivery.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h4 className={styles.colTitle}>{c.title}</h4>
              <ul className={styles.list}>
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className={styles.link}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className={styles.copy}>&copy; {year} BiteVerse. All rights reserved.</p>
      </div>
    </footer>
  );
}
