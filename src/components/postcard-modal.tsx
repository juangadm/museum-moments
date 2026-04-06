"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toPng } from "html-to-image";

type Props = {
  imageUrl: string;
  title: string;
  slug: string;
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

export function PostcardModal({ imageUrl, title, slug, creator, year }: Props) {
  const [open, setOpen] = useState(false);
  const [toValue, setToValue] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [messageValue, setMessageValue] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const postcardRef = useRef<HTMLDivElement>(null);

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
    if (!postcardRef.current) return;

    const dataUrl = await toPng(postcardRef.current, { pixelRatio: 2 });
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `postcard-${slug}.png`, { type: "image/png" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title });
      } catch {
        // User cancelled
      }
    } else {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = file.name;
      a.click();
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
            ref={postcardRef}
            className="bg-white"
            style={{
              boxShadow: "0 4px 30px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.03)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              width: "min(90vw, 920px)",
              height: "min(75vh, 560px)",
            }}
          >
            {/* Left side — artwork */}
            <div
              className="flex flex-col items-center p-8 overflow-hidden"
              style={{ borderRight: "1px solid #d4d4d4" }}
            >
              <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                <Image
                  src={imageUrl}
                  alt={title}
                  width={600}
                  height={400}
                  className="object-contain"
                  style={{ maxHeight: "100%", maxWidth: "100%", border: "1px solid #e5e5e5" }}
                />
              </div>
              <div className="mt-4 text-center flex-shrink-0">
                <p
                  className="font-body text-foreground"
                  style={{ fontSize: "14px", lineHeight: "20px" }}
                >
                  {title}
                </p>
                {caption && (
                  <p
                    className="font-body text-foreground-muted"
                    style={{ fontSize: "13px", lineHeight: "18px", marginTop: "3px" }}
                  >
                    {caption}
                  </p>
                )}
              </div>
            </div>

            {/* Right side — postcard form */}
            <div className="flex flex-col p-8">
              {/* Header row: POSTCARD + stamp */}
              <div className="flex items-start justify-between mb-8">
                <h3
                  className="font-display"
                  style={{
                    fontSize: "15px",
                    letterSpacing: "0.35em",
                    fontWeight: 500,
                    marginTop: "10px",
                  }}
                >
                  POSTCARD
                </h3>
                <Stamp />
              </div>

              {/* Form fields */}
              <div className="flex flex-col flex-1">
                <div className="mb-6">
                  <label
                    className="font-body text-foreground-muted block"
                    style={{ fontSize: "13px", marginBottom: "8px" }}
                  >
                    To:
                  </label>
                  <input
                    type="text"
                    value={toValue}
                    onChange={(e) => setToValue(e.target.value)}
                    className="w-full bg-transparent text-foreground outline-none font-[family-name:var(--font-biro-script)]"
                    style={{
                      fontSize: "16px",
                      borderBottom: "1px solid #d4d4d4",
                      paddingBottom: "8px",
                    }}
                  />
                </div>

                <div className="mb-6">
                  <label
                    className="font-body text-foreground-muted block"
                    style={{ fontSize: "13px", marginBottom: "8px" }}
                  >
                    From:
                  </label>
                  <input
                    type="text"
                    value={fromValue}
                    onChange={(e) => setFromValue(e.target.value)}
                    className="w-full bg-transparent text-foreground outline-none font-[family-name:var(--font-biro-script)]"
                    style={{
                      fontSize: "16px",
                      borderBottom: "1px solid #d4d4d4",
                      paddingBottom: "8px",
                    }}
                  />
                </div>

                <div className="flex-1 min-h-0">
                  <label
                    className="font-body text-foreground-muted block"
                    style={{ fontSize: "13px", marginBottom: "8px" }}
                  >
                    Message:
                  </label>
                  <textarea
                    value={messageValue}
                    onChange={(e) => setMessageValue(e.target.value)}
                    className="w-full bg-transparent text-foreground outline-none resize-none font-[family-name:var(--font-biro-script)]"
                    style={{
                      fontSize: "16px",
                      height: "100%",
                      backgroundImage:
                        "repeating-linear-gradient(transparent, transparent 27px, #d4d4d4 27px, #d4d4d4 28px)",
                      lineHeight: "28px",
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
