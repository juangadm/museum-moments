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
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
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

  return (
    <>
      <Suspense fallback={null}>
        <CategoryFilter />
      </Suspense>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="max-w-2xl mb-16">
          <h1 className="font-display text-sm font-medium mb-4">Archive</h1>
          <p className="font-body text-lg text-foreground-muted leading-relaxed">
            A curated collection of design moments worth preserving. Each entry
            is selected and described by hand. Stop the slop. Build the
            beautiful.
          </p>
        </div>

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
