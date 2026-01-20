import Link from "next/link";

export function Footer() {
  return (
    <footer
      role="contentinfo"
      className="w-full bg-background text-foreground font-body text-base leading-6"
    >
      <nav
        aria-label="Footer navigation"
        className="max-w-7xl mx-auto px-6 py-8 flex flex-wrap items-center justify-center gap-6"
      >
        <Link
          href="/"
          className="font-logo text-[14px] font-medium text-foreground hover:text-foreground-muted transition-colors"
        >
          Museum Moments
        </Link>
        <Link
          href="/about"
          className="font-display text-xs font-medium text-foreground-muted hover:text-foreground transition-colors uppercase"
        >
          About
        </Link>
        <Link
          href="/submit"
          className="font-display text-xs font-medium text-foreground-muted hover:text-foreground transition-colors uppercase"
        >
          Submit
        </Link>
        <a
          href="https://x.com/juangadm_"
          target="_blank"
          rel="noopener noreferrer"
          className="font-display text-xs font-medium text-foreground-muted hover:text-foreground transition-colors uppercase"
        >
          Twitter
        </a>
        <a
          href="https://www.threads.com/@juangadm"
          target="_blank"
          rel="noopener noreferrer"
          className="font-display text-xs font-medium text-foreground-muted hover:text-foreground transition-colors uppercase"
        >
          Threads
        </a>
        <a
          href="https://delightinthedetails.substack.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-display text-xs font-medium text-foreground-muted hover:text-foreground transition-colors uppercase"
        >
          Substack
        </a>
        <a
          href="https://www.linkedin.com/in/juangadm/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-display text-xs font-medium text-foreground-muted hover:text-foreground transition-colors uppercase"
        >
          LinkedIn
        </a>
      </nav>
    </footer>
  );
}
