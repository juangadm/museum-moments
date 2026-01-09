import Image from "next/image";
import Link from "next/link";
import type { Moment } from "@/lib/moments";
import { getContrastColor } from "@/lib/color-extractor";

type MomentCardProps = {
  moment: Moment;
};

export function MomentCard({ moment }: MomentCardProps) {
  const overlayColor = moment.dominantColor || "#1a1a1a";
  const textColor = getContrastColor(overlayColor);

  return (
    <Link
      href={`/m/${moment.slug}`}
      className="block break-inside-avoid mb-6 group"
    >
      <article className="relative overflow-hidden border border-border hover:border-border-strong transition-colors">
        {moment.imageUrl && (
          <div className="relative">
            <Image
              src={moment.imageUrl}
              alt={moment.title}
              width={400}
              height={300}
              className="w-full h-auto object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />

            {/* Desktop only: Hover overlay with dominant color */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex flex-col justify-start p-4"
              style={{ backgroundColor: `${overlayColor}cc` }}
            >
              <h2
                className="font-body text-base leading-snug"
                style={{ color: textColor }}
              >
                {moment.title}
              </h2>
              {moment.creatorName && (
                <p
                  className="font-display text-[10px] mt-2"
                  style={{ color: textColor, opacity: 0.9 }}
                >
                  by {moment.creatorName}
                </p>
              )}
              <span
                className="font-display text-[10px] mt-1"
                style={{ color: textColor, opacity: 0.7 }}
              >
                {moment.category}
              </span>
            </div>
          </div>
        )}
        {/* Mobile: No metadata shown - just the image. Tap to see details. */}
      </article>
    </Link>
  );
}
