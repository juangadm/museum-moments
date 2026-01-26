import { getMoments } from "@/lib/moments";
import { MomentCard } from "@/components/moment-card";
import { CategoryFilter } from "@/components/category-filter";
import { Suspense } from "react";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function MomentsGrid({
  category,
  search,
}: {
  category?: string;
  search?: string;
}) {
  const moments = await getMoments({ category, search });

  if (moments.length === 0) {
    return (
      <div className="py-24 border border-dashed border-border-strong flex items-center justify-center">
        <span className="font-display text-xs text-foreground-muted">
          {search
            ? `No moments found for "${search}"`
            : category
              ? `No moments in ${category}`
              : "No moments yet"}
        </span>
      </div>
    );
  }

  return (
    <div className="columns-2 lg:columns-4 gap-3">
      {moments.map((moment) => (
        <MomentCard key={moment.id} moment={moment} />
      ))}
    </div>
  );
}

export default async function Home(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const category =
    typeof searchParams.category === "string"
      ? searchParams.category
      : undefined;
  const search =
    typeof searchParams.q === "string" ? searchParams.q : undefined;

  // Get count for the active category
  const moments = await getMoments({ category, search });
  const count = moments.length;

  return (
    <>
      <div>
        <Suspense fallback={null}>
          <CategoryFilter count={count} />
        </Suspense>
      </div>

      <div className="px-3 pt-3 pb-16">
        <Suspense
          fallback={
            <div className="py-24 flex items-center justify-center">
              <span className="font-display text-xs text-foreground-muted">
                Loading...
              </span>
            </div>
          }
        >
          <MomentsGrid category={category} search={search} />
        </Suspense>
      </div>
    </>
  );
}
