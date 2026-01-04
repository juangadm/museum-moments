import { getMoments } from "@/lib/moments";
import { MomentCard } from "@/components/moment-card";

export default async function Home() {
  const moments = await getMoments();

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="max-w-2xl mb-16">
        <h1 className="font-display text-sm font-medium mb-4">Archive</h1>
        <p className="font-body text-lg text-foreground-muted leading-relaxed">
          A curated collection of design moments worth preserving. Each entry is
          selected and described by hand. Stop the slop. Build the beautiful.
        </p>
      </div>

      {moments.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
          {moments.map((moment) => (
            <MomentCard key={moment.id} moment={moment} />
          ))}
        </div>
      ) : (
        <div className="py-24 border border-dashed border-border-strong flex items-center justify-center">
          <span className="font-display text-xs text-foreground-muted">
            No moments yet
          </span>
        </div>
      )}
    </div>
  );
}
