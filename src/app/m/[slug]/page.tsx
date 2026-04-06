import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MediaDisplay } from "@/components/media-display";
import {
  getMomentBySlug,
  getAdjacentMoments,
  getRelatedMoments,
} from "@/lib/moments";
import { formatYear } from "@/lib/utils";
import { MomentNavigation } from "@/components/moment-navigation";
import { RelatedMoments } from "@/components/related-moments";
import { PostcardModal } from "@/components/postcard-modal";
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

  const yearDisplay = formatYear(moment.year, moment.yearApproximate);

  return (
    <MomentEditWrapper moment={moment}>
      <MomentNavigation prev={prev} next={next} />

      <article className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Side-by-side: image left, metadata right */}
        <div className="flex flex-col md:flex-row md:gap-12 lg:gap-16">
          {/* Image */}
          {moment.imageUrl && (
            <div className="md:w-[58%] md:flex-shrink-0 mb-8 md:mb-0">
              <a
                href={moment.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <MediaDisplay
                  src={moment.imageUrl}
                  alt={moment.title}
                  width={1200}
                  height={800}
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: "calc(100vh - 160px)" }}
                  priority
                />
              </a>
            </div>
          )}

          {/* Wall label */}
          <div className="flex-1 flex flex-col">
            {/* Title */}
            <h1
              className="font-display font-semibold leading-tight"
              style={{ fontSize: '18px' }}
            >
              {moment.title}
            </h1>

            {/* Creator */}
            {moment.creatorName && (
              <p className="font-body text-sm text-foreground mt-1.5">
                {moment.creatorName}
              </p>
            )}

            {/* Year */}
            {yearDisplay && (
              <p className="font-body text-sm text-foreground-muted mt-0.5">
                {yearDisplay}
              </p>
            )}

            {/* Description */}
            <div className="mt-6">
              <p
                className="font-body text-foreground"
                style={{ fontSize: '13px', lineHeight: '20px' }}
              >
                {moment.description}
              </p>
              <p
                className="font-body text-foreground-muted italic mt-3"
                style={{ fontSize: '12px' }}
              >
                — Juan Gabriel Delgado
              </p>
            </div>

            {/* View at source */}
            <a
              href={moment.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm text-foreground-muted hover:text-foreground transition-colors mt-6 inline-block"
            >
              View at source ↗
            </a>

            {/* Category */}
            <Link
              href={`/?category=${encodeURIComponent(moment.category)}`}
              className="font-body text-sm text-foreground-muted hover:text-foreground transition-colors mt-4"
            >
              {moment.category}
            </Link>

            {/* Tags — quiet, comma-separated */}
            {moment.tags.length > 0 && (
              <p
                className="font-body text-foreground-muted mt-1"
                style={{ fontSize: '12px' }}
              >
                {moment.tags.join(", ")}
              </p>
            )}

            {/* Send as postcard */}
            {moment.imageUrl && (
              <div className="mt-6">
                <PostcardModal
                  imageUrl={moment.imageUrl}
                  title={moment.title}
                  slug={moment.slug}
                  creator={moment.creatorName ?? undefined}
                  year={yearDisplay ?? undefined}
                />
              </div>
            )}
          </div>
        </div>

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
