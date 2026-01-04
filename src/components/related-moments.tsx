import Image from "next/image";
import Link from "next/link";
import type { Moment } from "@/lib/moments";

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
          {moments.map((moment) => (
            <Link
              key={moment.id}
              href={`/m/${moment.slug}`}
              className="group block"
            >
              <article className="border border-border hover:border-border-strong transition-colors">
                {moment.imageUrl && (
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                      src={moment.imageUrl}
                      alt={moment.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-4">
                  <span className="font-display text-[10px] text-foreground-muted">
                    {moment.category}
                  </span>
                  <h3 className="font-body text-base mt-1 leading-snug group-hover:opacity-70 transition-opacity">
                    {moment.title}
                  </h3>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
