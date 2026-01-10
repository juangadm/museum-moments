"use client";

import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="w-full bg-black" style={{ padding: "1.2px 6px" }}>
      <div className="max-w-7xl mx-auto">
        <ul className="flex gap-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((category) => {
            const isActive = category === currentCategory;
            return (
              <li key={category} className="flex items-stretch">
                <button
                  onClick={() => handleCategoryClick(category)}
                  className={`relative flex-shrink-0 font-display text-[11px] uppercase tracking-[0.1px] whitespace-nowrap text-white py-[3px] my-[1.5px] hover:font-bold hover:underline ${isActive ? 'font-bold underline' : ''}`}
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
