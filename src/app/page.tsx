export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-sm font-medium mb-4">Archive</h1>
        <p className="font-body text-lg text-foreground-muted leading-relaxed">
          A curated collection of design moments worth preserving. Each entry is
          selected and described by hand. Stop the slop. Build the beautiful.
        </p>
      </div>

      {/* Masonry grid placeholder */}
      <div className="mt-16 py-24 border border-dashed border-border-strong flex items-center justify-center">
        <span className="font-display text-xs text-foreground-muted">
          Moments will appear here
        </span>
      </div>
    </div>
  );
}
