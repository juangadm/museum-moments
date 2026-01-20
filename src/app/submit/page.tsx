import type { Metadata } from "next";
import { SubmissionForm } from "@/components/submission-form";

export const metadata: Metadata = {
  title: "Nominate a Moment",
  description: "Suggest a design moment for the Museum Moments archive.",
};

export default function SubmitPage() {
  return (
    <div className="min-h-[80vh] flex items-start justify-center px-6 py-16 md:py-24">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="font-display text-xs font-medium tracking-widest uppercase mb-4">
            Nominate a Moment
          </h1>
          <p className="font-body text-base text-foreground-muted leading-relaxed">
            Found something worth preserving?
            <br />
            Suggest a design moment for the archive.
          </p>
        </div>

        <SubmissionForm />

        <p className="text-center font-body text-xs text-foreground-muted mt-8">
          All submissions are reviewed by hand.
          <br />
          Not everything will be accepted — that&apos;s the point.
        </p>
      </div>
    </div>
  );
}
