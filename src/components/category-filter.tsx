"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useLayoutEffect } from "react";
import { CATEGORIES } from "@/lib/constants";

const FILTER_OPTIONS = ["All", ...CATEGORIES];

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "All";

  // Refs for measuring text positions (for tight indicator)
  const containerRef = useRef<HTMLUListElement>(null);
  const textRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  // Sliding indicator position
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  // Track which button is being pressed
  const [pressedCategory, setPressedCategory] = useState<string | null>(null);

  // Update indicator position when active category changes
  useLayoutEffect(() => {
    const activeText = textRefs.current.get(currentCategory);
    if (activeText && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const textRect = activeText.getBoundingClientRect();

      setIndicatorStyle({
        left: textRect.left - containerRect.left - 2,
        top: textRect.top - containerRect.top - 1,
        width: textRect.width + 4,
        height: textRect.height + 2,
        opacity: 1,
      });
    }
  }, [currentCategory]);

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

  return (
    <div className="px-3 overflow-x-auto scrollbar-hide">
      <ul
        ref={containerRef}
        className="relative flex gap-3 pt-[3px] pb-3"
      >
          {/* Sliding indicator */}
          <div
            className="absolute bg-black/6 rounded-[4px] transition-all duration-200 pointer-events-none"
            style={{
              left: indicatorStyle.left,
              top: indicatorStyle.top,
              width: indicatorStyle.width,
              height: indicatorStyle.height,
              opacity: indicatorStyle.opacity,
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />

          {FILTER_OPTIONS.map((category) => {
            const isActive = category === currentCategory;
            return (
              <li key={category}>
                <button
                  onClick={() => handleCategoryClick(category)}
                  onPointerDown={() => setPressedCategory(category)}
                  onPointerUp={() => setPressedCategory(null)}
                  onPointerLeave={() => setPressedCategory(null)}
                  className={`relative font-display text-[12px] uppercase tracking-[0px] whitespace-nowrap min-h-[44px] flex items-center cursor-pointer transition-colors duration-150 ease-out focus-ring active:opacity-70 ${isActive ? "text-foreground" : "text-foreground/70"}`}
                >
                  <span
                    ref={(el) => {
                      if (el) textRefs.current.set(category, el);
                    }}
                    className={`inline-block px-[2px] py-[1px] rounded-[4px] transition-all duration-75 ease-out ${!isActive ? "hover:bg-black/6" : ""}`}
                    style={{
                      transform: pressedCategory === category ? "scale(0.95)" : "scale(1)",
                    }}
                  >
                    {category}
                  </span>
                </button>
              </li>
            );
          })}

      </ul>
    </div>
  );
}
