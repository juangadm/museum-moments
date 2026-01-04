import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="font-display text-sm font-medium">
          Museum Moments
        </Link>
        <nav className="flex items-center gap-8">
          <Link
            href="/about"
            className="font-display text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            href="/submit"
            className="font-display text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            Submit
          </Link>
        </nav>
      </div>
    </header>
  );
}
