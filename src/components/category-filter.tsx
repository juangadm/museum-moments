"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const CATEGORIES = [
  "All",
  "Branding",
  "Images",
  "Interfaces",
  "Objects",
  "Spaces",
  "Typography",
];

export function CategoryFilter({ count }: { count: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "All";
  const [displayCount, setDisplayCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (count !== displayCount) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setDisplayCount(count);
        setIsAnimating(false);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [count, displayCount]);

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
        <ul className="flex gap-3 overflow-x-auto scrollbar-hide pt-[3px] pb-3 px-[0.1px]">
          {CATEGORIES.map((category) => {
            const isActive = category === currentCategory;
            return (
              <li key={category}>
                <button
                  onClick={() => handleCategoryClick(category)}
                  className="relative font-display text-[12px] uppercase tracking-[0px] whitespace-nowrap text-black font-semibold py-[3px] hover:text-[#A0A0A0] underline-offset-4 cursor-pointer"
                >
                  <span className={isActive ? 'underline underline-offset-4' : ''}>{category}</span>
                </button>
              </li>
            );
          })}
          <li className="flex items-center">
            <span className="relative inline-flex items-center font-display text-[12px] uppercase tracking-[0px] whitespace-nowrap text-black font-semibold py-[3px] overflow-hidden">
              ( <span className="inline-block" style={{
                transform: isAnimating ? 'translateY(-100%)' : 'translateY(0)',
                opacity: isAnimating ? 0 : 1,
                transition: 'transform 150ms ease-out, opacity 150ms ease-out'
              }}>{displayCount}</span> )
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
