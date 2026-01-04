"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";

const CATEGORIES = [
  "All",
  "Illustration",
  "Web Design",
  "Photography",
  "Article",
  "Graphic Design",
  "Poster",
  "Product Design",
  "Typography",
  "Art",
  "3D",
  "Branding",
  "Interior Design",
  "Architecture",
  "Advertising",
  "Automotive",
  "Portfolio",
  "Animation",
  "Events",
  "Installation",
  "Comics",
  "Books",
];

function ChevronLeftIcon({ className }: { className?: string }) {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "All";
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    function updateArrows() {
      if (!container) return;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }

    updateArrows();
    container.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);

    return () => {
      container.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  function handleCategoryClick(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "All") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/");
  }

  function scrollLeft() {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  }

  function scrollRight() {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  }

  return (
    <div className="relative border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative">
          {/* Left scroll indicator */}
          {showLeftArrow && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-gradient-to-r from-background via-background to-transparent pr-4"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="text-foreground-muted hover:text-foreground transition-colors" />
            </button>
          )}

          {/* Categories container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-1 overflow-x-auto scrollbar-hide py-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {CATEGORIES.map((category) => {
              const isActive = category === currentCategory;
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`
                    flex-shrink-0 px-4 py-2 font-display text-xs font-medium
                    rounded-full border transition-all duration-100 ease-out
                    hover:scale-[1.02] active:scale-[0.98]
                    ${
                      isActive
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-foreground-muted border-border hover:border-foreground-muted hover:text-foreground"
                    }
                  `}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Right scroll indicator */}
          {showRightArrow && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-gradient-to-l from-background via-background to-transparent pl-4"
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="text-foreground-muted hover:text-foreground transition-colors" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
