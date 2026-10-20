import Link from "next/link";

export function SiteHeader() {
  return (
    <header>
      <nav>
        <Link href="/">BiteVerse</Link>
        <Link href="/login">Log in</Link>
      </nav>
    </header>
  );
}
