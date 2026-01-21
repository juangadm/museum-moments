"use client";

import { useState } from "react";

type Props = {
  title: string;
};

export function ShareButton({ title }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="font-display text-xs px-3 py-2 border border-foreground text-foreground hover:bg-[#a0a0a0] hover:border-[#a0a0a0] active:opacity-70 transition-colors focus-ring"
      style={{ borderRadius: '0' }}
    >
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
