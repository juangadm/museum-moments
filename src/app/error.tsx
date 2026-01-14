"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development, could send to error tracking in prod
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-2xl tracking-wider mb-4">
          SOMETHING WENT WRONG
        </h1>
        <p className="font-body text-neutral-600 mb-6">
          We encountered an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          className="font-display text-sm tracking-wider border border-neutral-900 px-6 py-2 hover:bg-neutral-900 hover:text-white transition-colors"
        >
          TRY AGAIN
        </button>
      </div>
    </div>
  );
}
