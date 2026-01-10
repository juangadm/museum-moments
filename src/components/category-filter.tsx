"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  "All",
  "Branding",
  "Images",
  "Interfaces",
  "Objects",
  "Spaces",
  "Typography",
];

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "All";

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
    <div className="px-6">
      <div className="max-w-7xl mx-auto">
        <ul className="flex gap-3 overflow-x-auto scrollbar-hide py-[1.2px]">
          {CATEGORIES.map((category) => {
            const isActive = category === currentCategory;
            return (
              <li key={category}>
                <button
                  onClick={() => handleCategoryClick(category)}
                  className="relative font-display text-[11px] uppercase tracking-[0.1px] whitespace-nowrap text-foreground py-[3px] hover:underline"
                >
                  <span className={isActive ? 'underline' : ''}>{category}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
