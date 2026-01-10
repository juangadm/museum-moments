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
      className="font-display text-xs px-3 py-2 border border-foreground text-foreground hover:bg-[#a0a0a0] hover:border-[#a0a0a0] transition-colors"
      style={{ borderRadius: '0' }}
    >
      Share
    </button>
  );
}
