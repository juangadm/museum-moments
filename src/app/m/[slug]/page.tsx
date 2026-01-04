import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getMomentBySlug,
  getAdjacentMoments,
  getRelatedMoments,
  getMoments,
} from "@/lib/moments";
import { MomentNavigation } from "@/components/moment-navigation";
import { RelatedMoments } from "@/components/related-moments";
import { ShareButton } from "@/components/share-button";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const moments = await getMoments();
  return moments.map((m) => ({ slug: m.slug }));
}

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

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
    <>
      <MomentNavigation prev={prev} next={next} />

      <article className="max-w-4xl mx-auto px-6 py-16">
        {/* Meta row */}
        <div className="flex items-center gap-3 font-display text-[10px] text-foreground-muted mb-6">
          <span>{moment.category}</span>
          <span aria-hidden="true">•</span>
          {moment.creatorName && (
            <>
              {moment.creatorUrl ? (
                <a
                  href={moment.creatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {moment.creatorName}
                </a>
              ) : (
                <span>{moment.creatorName}</span>
              )}
              <span aria-hidden="true">•</span>
            </>
          )}
          <time dateTime={moment.publishedAt.toISOString()}>
            {formatDate(moment.publishedAt)}
          </time>
        </div>

        {/* Title */}
        <h1 className="font-body text-3xl sm:text-4xl leading-tight mb-10">
          {moment.title}
        </h1>

        {/* Hero image */}
        {moment.imageUrl && (
          <div className="mb-10 border border-border rounded-md overflow-hidden">
            <Image
              src={moment.imageUrl}
              alt={moment.title}
              width={900}
              height={600}
              className="w-full h-auto"
              priority
            />
          </div>
        )}

        {/* Curator description */}
        <div className="max-w-2xl mb-12">
          <p className="font-body text-lg leading-relaxed text-foreground">
            {moment.description}
          </p>
        </div>

        {/* Tags */}
        {moment.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            {moment.tags.map((tag) => (
              <span
                key={tag}
                className="font-display text-[10px] px-3 py-1.5 border border-border text-foreground-muted rounded-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-8 border-t border-border">
          <a
            href={moment.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-xs inline-flex items-center gap-2 px-4 py-3 border border-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            Visit Original
            <span aria-hidden="true">&rarr;</span>
          </a>
          <ShareButton title={moment.title} />
        </div>

        {/* Prev/Next navigation */}
        <nav className="mt-16 pt-8 border-t border-border">
          <div className="flex justify-between items-start gap-8">
            <div className="flex-1">
              {prev && (
                <Link href={`/m/${prev.slug}`} className="group block">
                  <span className="font-display text-[10px] text-foreground-muted">
                    Previous
                  </span>
                  <p className="font-body text-base mt-1 group-hover:opacity-70 transition-opacity">
                    {prev.title}
                  </p>
                </Link>
              )}
            </div>
            <div className="flex-1 text-right">
              {next && (
                <Link href={`/m/${next.slug}`} className="group block">
                  <span className="font-display text-[10px] text-foreground-muted">
                    Next
                  </span>
                  <p className="font-body text-base mt-1 group-hover:opacity-70 transition-opacity">
                    {next.title}
                  </p>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </article>

      {/* Related moments */}
      {related.length > 0 && <RelatedMoments moments={related} />}
    </>
  );
}
