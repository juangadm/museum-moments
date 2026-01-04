import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-display text-xs font-medium">
              Museum Moments
            </span>
            <span className="font-body text-sm text-foreground-muted">
              A curated archive of design moments.
            </span>
          </div>
          <nav className="flex items-center gap-6">
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
            <Link
              href="/terms"
              className="font-display text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="font-display text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-border">
          <p className="font-display text-xs text-foreground-muted">
            Curated by Juan Gabriel Delgado
          </p>
        </div>
      </div>
    </footer>
  );
}
