import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy policy for Museum Moments.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-sm font-medium mb-8">Privacy</h1>
        <div className="space-y-6 font-body text-lg leading-relaxed text-foreground-muted">
          <p>
            Museum Moments does not collect personal data. There are no user
            accounts, cookies for tracking, or analytics that identify
            individuals.
          </p>
          <p>
            We may use basic, privacy-respecting analytics to understand overall
            traffic patterns.
          </p>
        </div>
      </div>
    </div>
  );
}
