import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Museum Moments is a curated archive of design inspiration, hand-selected and described.",
};

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-sm font-medium mb-8">About</h1>
        <div className="space-y-6 font-body text-lg leading-relaxed">
          <p>
            Museum Moments is a curated archive of design inspiration. Not a
            feed. Not AI slop. Each entry is hand-selected and described like an
            exhibit in a museum.
          </p>
          <p>
            The goal is simple: preserve moments of exceptional design craft and
            present them with the care they deserve.
          </p>
          <p className="text-foreground-muted">
            Stop the slop. Build the beautiful.
          </p>
        </div>
      </div>
    </div>
  );
}
