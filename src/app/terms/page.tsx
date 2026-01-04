import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for Museum Moments.",
};

export default function TermsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-sm font-medium mb-8">Terms of Use</h1>
        <div className="space-y-6 font-body text-lg leading-relaxed text-foreground-muted">
          <p>
            Museum Moments is provided as-is for informational and inspirational
            purposes. All featured works remain the property of their original
            creators.
          </p>
          <p>
            Links to external sites are provided for reference. We are not
            responsible for the content or availability of linked sites.
          </p>
        </div>
      </div>
    </div>
  );
}
