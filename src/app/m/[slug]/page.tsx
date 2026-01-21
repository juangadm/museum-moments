import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getMomentBySlug,
  getAdjacentMoments,
  getRelatedMoments,
} from "@/lib/moments";
import { MomentNavigation } from "@/components/moment-navigation";
import { RelatedMoments } from "@/components/related-moments";
import { ShareButton } from "@/components/share-button";
import { MomentEditWrapper } from "@/components/admin/moment-edit-wrapper";

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate pages on-demand (ISR) to avoid build-time database dependency
// Pages will be generated on first request and cached
export async function generateStaticParams() {
  return [];
}

export const dynamicParams = true; // Enable fallback for on-demand generation

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const moment = await getMomentBySlug(slug);

  if (!moment) {
    return { title: "Not Found" };
  }

  return {
    title: moment.title,
    description: moment.description.slice(0, 160),
    openGraph: {
      title: moment.title,
      description: moment.description.slice(0, 160),
      images: moment.imageUrl ? [moment.imageUrl] : undefined,
    },
  };
}

export default async function MomentPage({ params }: Props) {
  const { slug } = await params;
  const moment = await getMomentBySlug(slug);

  if (!moment) {
    notFound();
  }

  const [{ prev, next }, related] = await Promise.all([
    getAdjacentMoments(moment.publishedAt),
    getRelatedMoments(moment.id, moment.tags, moment.category),
  ]);

  return (
    <MomentEditWrapper moment={moment}>
      <MomentNavigation prev={prev} next={next} />

      <article className="max-w-4xl mx-auto px-6 py-16">
        {/* Title and Meta - stacked on mobile, row on desktop */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8 mb-6">
          {/* Title */}
          <h1 className="font-display font-semibold leading-tight" style={{ textTransform: 'uppercase', fontSize: '18px' }}>
            {moment.title}
          </h1>

          {/* Meta row - Category • Creator */}
          <div className="text-sm sm:whitespace-nowrap sm:flex-shrink-0">
            <Link
              href={`/?category=${encodeURIComponent(moment.category)}`}
              className="text-neutral-500 hover:text-black active:opacity-70 transition-colors focus-ring"
            >
              {moment.category}
            </Link>
            {moment.creatorName && (
              <>
                <span className="text-neutral-500"> • </span>
                {moment.creatorUrl ? (
                  <a
                    href={moment.creatorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-500 hover:text-black active:opacity-70 transition-colors focus-ring"
                  >
                    {moment.creatorName} ↗
                  </a>
                ) : (
                  <span className="text-neutral-500">{moment.creatorName}</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Hero image */}
        {moment.imageUrl && (
          <div className="mb-8">
            <a
              href={moment.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Image
                src={moment.imageUrl}
                alt={moment.title}
                width={1200}
                height={800}
                className="w-full h-auto"
                priority
              />
            </a>
          </div>
        )}

        {/* Curator commentary */}
        <div className="max-w-2xl mb-6">
          <h2
            className="font-display font-semibold"
            style={{
              textTransform: 'uppercase',
              fontSize: '12px',
              lineHeight: '14.4px',
              color: '#000000',
              margin: '0'
            }}
          >
            Curatorial Statement
          </h2>
          <div
            className="font-body text-foreground"
            style={{
              marginTop: '6px',
              fontSize: '12px',
              lineHeight: '14.4px'
            }}
          >
            <p style={{ margin: '0' }}>{moment.description}</p>
            <p
              className="text-foreground-muted italic"
              style={{ marginTop: '12px', margin: '12px 0 0 0' }}
            >
              — Juan Gabriel Delgado
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6">
          <ShareButton title={moment.title} />
          <a
            href={moment.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-xs inline-flex items-center gap-2 px-3 py-2 border border-foreground bg-foreground hover:bg-[#a0a0a0] hover:border-[#a0a0a0] transition-colors"
            style={{ borderRadius: '0', color: '#ffffff' }}
          >
            Visit Original
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        {/* Tags */}
        {moment.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {moment.tags.map((tag) => (
              <span
                key={tag}
                className="font-display text-[11px] sm:text-[10px] px-3 py-2 sm:px-2 sm:py-1 border border-border text-foreground-muted hover:border-foreground hover:text-foreground active:bg-foreground/5 transition-colors cursor-pointer"
                style={{ borderRadius: '0' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Prev/Next navigation */}
        <nav className="mt-16">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              {prev && (
                <Link
                  href={`/m/${prev.slug}`}
                  className="group inline-flex items-center gap-2 py-2 hover:opacity-70 active:opacity-50 transition-opacity focus-ring"
                >
                  <span aria-hidden="true" className="text-2xl">←</span>
                  <span className="font-body text-xs text-foreground-muted">
                    Previous
                  </span>
                </Link>
              )}
            </div>
            <div className="hidden sm:flex flex-1 justify-center">
              <span className="font-body text-xs text-foreground-muted">
                Use ← → to navigate
              </span>
            </div>
            <div className="flex-1 text-right">
              {next && (
                <Link
                  href={`/m/${next.slug}`}
                  className="group inline-flex items-center gap-2 py-2 hover:opacity-70 active:opacity-50 transition-opacity focus-ring"
                >
                  <span className="font-body text-xs text-foreground-muted">
                    Next
                  </span>
                  <span aria-hidden="true" className="text-2xl">→</span>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </article>

      {/* Related moments */}
      {related.length > 0 && <RelatedMoments moments={related} />}
    </MomentEditWrapper>
  );
}
