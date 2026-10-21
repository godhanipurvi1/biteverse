export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <span>&copy; {new Date().getFullYear()} BiteVerse</span>
        <span>Food delivery, made simple</span>
      </div>
    </footer>
  );
}
