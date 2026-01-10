"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  }

  return (
    <header className="bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Logo and tagline */}
        <div className="flex items-center gap-4">
          <Link href="/" className="font-logo text-3xl uppercase">
            Museum Moments
          </Link>
          <p className="text-[14px] text-foreground-muted font-body">
            an exhibition curated to stop the slop and build the beautiful
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          {searchOpen ? (
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2"
            >
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search moments..."
                className="w-40 sm:w-56 px-3 py-1.5 text-sm font-body bg-transparent border border-border rounded-sm focus:outline-none focus:border-foreground-muted transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-2 text-foreground-muted hover:text-foreground transition-colors"
                aria-label="Close search"
              >
                <XIcon />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Search"
            >
              <SearchIcon />
            </button>
          )}

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Menu"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <MenuIcon />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-sm shadow-lg py-2 z-50">
                <Link
                  href="/about"
                  className="block px-4 py-2.5 font-display text-xs text-foreground-muted hover:text-foreground hover:bg-border/30 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/submit"
                  className="block px-4 py-2.5 font-display text-xs text-foreground-muted hover:text-foreground hover:bg-border/30 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Submit a Design
                </Link>
                <a
                  href="https://forms.gle/subscribe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2.5 font-display text-xs text-foreground-muted hover:text-foreground hover:bg-border/30 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Subscribe
                </a>
                <div className="border-t border-border mt-2 pt-2 px-4 pb-1">
                  <p className="text-[10px] text-foreground-muted font-body">
                    by{" "}
                    <a
                      href="https://twitter.com/juangadm_"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      Juan Gabriel Delgado
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
