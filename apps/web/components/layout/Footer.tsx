import Link from "next/link";

const LINKS: [string, string][] = [
  ["Help", "/help"],
  ["Terms", "/terms"],
  ["Privacy", "/privacy"],
];

export function Footer() {
  return (
    <footer className="site-footer gut">
      <div className="in">
        <span>&copy; {new Date().getFullYear()} BiteVerse</span>
        <nav aria-label="Footer">
          {LINKS.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
