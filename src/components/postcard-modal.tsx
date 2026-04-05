"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

type Props = {
  imageUrl: string;
  title: string;
  creator?: string;
  year?: string;
};

function Stamp() {
  return (
    <svg width="80" height="80" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="#c4756e"
        strokeWidth="2"
        opacity="0.7"
      />
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="#c4756e"
        strokeWidth="1"
        opacity="0.5"
      />
      <circle cx="50" cy="50" r="2" fill="#c4756e" opacity="0.6" />
      <defs>
        <path
          id="stampCircle"
          d="M 50,50 m -30,0 a 30,30 0 1,1 60,0 a 30,30 0 1,1 -60,0"
        />
      </defs>
      <text
        fill="#c4756e"
        fontSize="8.5"
        fontFamily="var(--font-display), monospace"
        letterSpacing="3"
        opacity="0.75"
      >
        <textPath href="#stampCircle" startOffset="5%">
          MUSEUM MOMENTS
        </textPath>
      </text>
    </svg>
  );
}

export function PostcardModal({ imageUrl, title, creator, year }: Props) {
  const [open, setOpen] = useState(false);
  const [toValue, setToValue] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [messageValue, setMessageValue] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleShare() {
    const shareText = [
      title,
      creator && year ? `${creator}, ${year}` : creator || year || "",
      messageValue ? `"${messageValue}"` : "",
      window.location.href,
    ]
      .filter(Boolean)
      .join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: window.location.href });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  }

  const caption = [creator, year].filter(Boolean).join(", ");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-body text-sm text-foreground-muted hover:text-foreground active:opacity-70 transition-colors focus-ring"
      >
        Send as postcard
      </button>

      {open && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ backgroundColor: "rgba(245, 243, 240, 0.97)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Back button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full border border-border hover:border-foreground transition-colors z-10"
            aria-label="Close postcard"
          >
            <span className="text-lg">←</span>
          </button>

          {/* Postcard */}
          <div
            className="bg-white w-[90vw] max-w-[780px]"
            style={{
              boxShadow: "0 2px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              maxHeight: "80vh",
            }}
          >
            {/* Left side — artwork */}
            <div
              className="flex flex-col items-center justify-center p-6 overflow-hidden"
              style={{ borderRight: "1px solid #d4d4d4" }}
            >
              <div className="relative w-full flex-1 min-h-0 flex items-center justify-center">
                <Image
                  src={imageUrl}
                  alt={title}
                  width={600}
                  height={400}
                  className="object-contain"
                  style={{ maxHeight: "100%", maxWidth: "100%", border: "1px solid #e5e5e5" }}
                />
              </div>
              <div className="mt-3 text-center flex-shrink-0">
                <p
                  className="font-body text-foreground"
                  style={{ fontSize: "13px", lineHeight: "18px" }}
                >
                  {title}
                </p>
                {caption && (
                  <p
                    className="font-body text-foreground-muted"
                    style={{ fontSize: "12px", lineHeight: "16px", marginTop: "2px" }}
                  >
                    {caption}
                  </p>
                )}
              </div>
            </div>

            {/* Right side — postcard form */}
            <div className="flex flex-col p-6">
              {/* Header row: POSTCARD + stamp */}
              <div className="flex items-start justify-between mb-6">
                <h3
                  className="font-display"
                  style={{
                    fontSize: "14px",
                    letterSpacing: "0.35em",
                    fontWeight: 500,
                    marginTop: "8px",
                  }}
                >
                  POSTCARD
                </h3>
                <Stamp />
              </div>

              {/* Form fields */}
              <div className="flex flex-col gap-5 flex-1">
                <div>
                  <label
                    className="font-body text-foreground-muted block mb-1"
                    style={{ fontSize: "12px" }}
                  >
                    To:
                  </label>
                  <input
                    type="text"
                    value={toValue}
                    onChange={(e) => setToValue(e.target.value)}
                    className="w-full bg-transparent font-body text-foreground outline-none"
                    style={{
                      fontSize: "13px",
                      borderBottom: "1px solid #d4d4d4",
                      paddingBottom: "6px",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="font-body text-foreground-muted block mb-1"
                    style={{ fontSize: "12px" }}
                  >
                    From:
                  </label>
                  <input
                    type="text"
                    value={fromValue}
                    onChange={(e) => setFromValue(e.target.value)}
                    className="w-full bg-transparent font-body text-foreground outline-none"
                    style={{
                      fontSize: "13px",
                      borderBottom: "1px solid #d4d4d4",
                      paddingBottom: "6px",
                    }}
                  />
                </div>

                <div className="flex-1">
                  <label
                    className="font-body text-foreground-muted block mb-1"
                    style={{ fontSize: "12px" }}
                  >
                    Message:
                  </label>
                  <textarea
                    value={messageValue}
                    onChange={(e) => setMessageValue(e.target.value)}
                    className="w-full h-full bg-transparent font-body text-foreground outline-none resize-none"
                    style={{
                      fontSize: "13px",
                      backgroundImage:
                        "repeating-linear-gradient(transparent, transparent 25px, #d4d4d4 25px, #d4d4d4 26px)",
                      lineHeight: "26px",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Share button below postcard */}
          <button
            onClick={handleShare}
            className="mt-6 font-body text-sm px-6 py-2.5 border border-foreground text-foreground hover:bg-foreground hover:text-white active:opacity-70 transition-colors"
          >
            Share
          </button>
        </div>
      )}
    </>
  );
}
