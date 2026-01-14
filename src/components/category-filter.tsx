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

export function CategoryFilter({ count }: { count: number }) {
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
            <span className="font-display text-[12px] uppercase tracking-[0px] whitespace-nowrap text-black font-semibold py-[3px]">
              ( {count} )
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
