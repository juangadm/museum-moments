import Image from "next/image";
import Link from "next/link";
import type { Moment } from "@/lib/moments";
import { getContrastColor } from "@/lib/color-extractor";

type Props = {
  moments: Moment[];
};

export function RelatedMoments({ moments }: Props) {
  return (
    <section className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="font-display text-xs text-foreground-muted mb-8">
          Related Moments
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {moments.map((moment) => {
            const overlayColor = moment.dominantColor || "#1a1a1a";
            const textColor = getContrastColor(overlayColor);

            return (
              <Link
                key={moment.id}
                href={`/m/${moment.slug}`}
                className="group block"
              >
                <article className="relative rounded-md overflow-hidden border border-border hover:border-border-strong transition-colors">
                  {moment.imageUrl && (
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <Image
                        src={moment.imageUrl}
                        alt={moment.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />

                      {/* Desktop only: Hover overlay with dominant color */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex flex-col justify-start p-4"
                        style={{ backgroundColor: `${overlayColor}cc` }}
                      >
                        <h3
                          className="font-body text-base leading-snug"
                          style={{ color: textColor }}
                        >
                          {moment.title}
                        </h3>
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
          })}
        </div>
      </div>
    </section>
  );
}
