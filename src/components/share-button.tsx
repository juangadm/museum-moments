"use client";

type Props = {
  title: string;
};

export function ShareButton({ title }: Props) {
  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="font-display text-xs px-4 py-3 border border-border text-foreground-muted hover:border-foreground hover:text-foreground transition-colors"
    >
      Share
    </button>
  );
}
