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
      <div className="max-w-7xl mx-auto bg-black" style={{ padding: "1.2px 6px" }}>
        <ul className="flex gap-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((category) => {
            const isActive = category === currentCategory;
            return (
              <li key={category} className="flex items-stretch">
                <button
                  onClick={() => handleCategoryClick(category)}
                  className={`relative flex-shrink-0 font-display text-[11px] uppercase tracking-[0.1px] whitespace-nowrap text-white py-[3px] my-[1.5px] hover:underline ${isActive ? 'font-bold underline' : ''}`}
                >
                  <span className="invisible font-bold absolute">{category}</span>
                  <span className="relative">{category}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
