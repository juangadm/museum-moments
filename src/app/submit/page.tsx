import type { Metadata } from "next";
import { SubmissionForm } from "@/components/submission-form";

export const metadata: Metadata = {
  title: "Nominate a Moment",
  description: "Suggest a design moment for the Museum Moments archive.",
};

export default function SubmitPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="max-w-lg">
        <h1 className="font-display text-sm font-medium mb-4">Nominate a Moment</h1>
        <div className="space-y-4 font-body text-base leading-relaxed mb-8">
          <p>
            Found something worth preserving? Suggest a design moment for the
            archive.
          </p>
          <p className="text-foreground-muted text-sm">
            All submissions are reviewed by hand. Not everything will be
            accepted — that&apos;s the point.
          </p>
        </div>

        <SubmissionForm />
      </div>
    </div>
  );
}
