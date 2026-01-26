import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Museum Moments is a curated archive of design inspiration, hand-selected and described like exhibits in a museum.",
};

export default function AboutPage() {
  return (
    <div className="min-h-[60vh] flex flex-col justify-center px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-[12px] font-semibold mb-8">About</h1>

        <div className="space-y-6 font-body text-[13px] leading-[1.6]">
          <p>
            Museum Moments captures the &ldquo;aha&rdquo; moments&mdash;those times when a
            piece of design stops you mid-scroll and demands your attention.
          </p>

          <p>
            Every entry is hand-selected and described like an exhibit label.
            Human taste, human judgment, human care. A counter to the slop.
          </p>

          <p>
            Inspired by my colleague Pablo Stanley&apos;s{" "}
            <a
              href="https://www.desigeist.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground-muted transition-colors"
            >
              Desigeist
            </a>
            .
          </p>

          <p className="text-foreground-muted">
            Stop the slop. Build the beautiful.
          </p>
        </div>

        {/* Substack CTA */}
        <section className="mt-8 pt-6 border-t border-border">
          <h2 className="font-display text-[11px] font-medium mb-2">
            Delight in the Details
          </h2>
          <p className="font-body text-[12px] text-foreground-muted mb-6">
            Essays on design, craft, and building beautiful things.
          </p>
          <iframe
            src="https://delightinthedetails.substack.com/embed"
            width="100%"
            height="150"
            style={{ border: "none", background: "transparent" }}
            frameBorder="0"
            scrolling="no"
          />
        </section>
      </div>
    </div>
  );
}
