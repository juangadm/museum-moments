import Link from "next/link";
import type { Moment } from "@/lib/moments";
import { MediaDisplay } from "./media-display";

type Props = {
  moments: Moment[];
};

export function RelatedMoments({ moments }: Props) {
  return (
    <section className="bg-background">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="font-display text-xs text-foreground font-semibold mb-8">
          Related Moments
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {moments.map((moment) => {
            const year = moment.publishedAt.getFullYear();

            return (
              <Link
                key={moment.id}
                href={`/m/${moment.slug}`}
                className="group block"
              >
                <article className="relative transition-opacity group-hover:opacity-95">
                  {/* Image/Video */}
                  {moment.imageUrl && (
                    <div className="relative border border-border overflow-hidden">
                      <MediaDisplay
                        src={moment.imageUrl}
                        alt={moment.title}
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  {/* Museum caption */}
                  <div className="mt-1.5 text-left">
                    <div className="font-body text-[11px] leading-[13.2px] text-foreground">
                      <div className="group-hover:italic">{moment.title}, {year}</div>
                      {moment.creatorName && <div>{moment.creatorName}</div>}
                      <div>{moment.category}</div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
