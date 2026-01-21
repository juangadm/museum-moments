"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useLayoutEffect } from "react";
import { CATEGORIES } from "@/lib/constants";

const FILTER_OPTIONS = ["All", ...CATEGORIES];

export function CategoryFilter({ count }: { count: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "All";

  // Refs for measuring button positions
  const containerRef = useRef<HTMLUListElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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
    const activeButton = buttonRefs.current.get(currentCategory);
    if (activeButton && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        top: buttonRect.top - containerRect.top,
        width: buttonRect.width,
        height: buttonRect.height,
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
    <div className="px-3">
      <div className="inline-block">
        <ul
          ref={containerRef}
          className="relative flex gap-3 overflow-x-auto scrollbar-hide pt-[3px] pb-3 px-[0.1px]"
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
                  ref={(el) => {
                    if (el) buttonRefs.current.set(category, el);
                  }}
                  onClick={() => handleCategoryClick(category)}
                  onPointerDown={() => setPressedCategory(category)}
                  onPointerUp={() => setPressedCategory(null)}
                  onPointerLeave={() => setPressedCategory(null)}
                  className={`relative font-display text-[12px] uppercase tracking-[0px] whitespace-nowrap px-[2px] py-[1px] rounded-[4px] cursor-pointer transition-colors duration-150 ease-out ${isActive ? "text-foreground" : "text-foreground/70 hover:bg-black/6"}`}
                >
                  <span
                    className="inline-block transition-transform duration-75 ease-out"
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

          {/* Count display */}
          <li className="flex items-center">
            <span className="font-display text-[12px] uppercase tracking-[0px] whitespace-nowrap text-foreground/70 px-[2px] py-[1px]">
              ( {count} )
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
