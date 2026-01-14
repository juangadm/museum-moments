import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit",
  description: "Suggest a design moment for Museum Moments.",
};

export default function SubmitPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-sm font-medium mb-8">Submit</h1>
        <div className="space-y-6 font-body text-lg leading-relaxed">
          <p>
            Found something worth preserving? Suggest a design moment for the
            archive.
          </p>
          <p className="text-foreground-muted">
            All submissions are reviewed by hand. Not everything will be
            accepted — that&apos;s the point.
          </p>
          <div className="pt-4">
            <a
              href="#"
              className="font-display text-xs font-medium inline-flex items-center gap-2 px-4 py-3 border border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Submit via Google Form
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
