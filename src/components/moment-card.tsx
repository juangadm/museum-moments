import Image from "next/image";
import Link from "next/link";
import type { Moment } from "@/lib/moments";

type MomentCardProps = {
  moment: Moment;
};

export function MomentCard({ moment }: MomentCardProps) {
  return (
    <Link
      href={`/m/${moment.slug}`}
      className="block break-inside-avoid mb-6 group"
    >
      <article className="border border-border hover:border-border-strong transition-colors">
        {moment.imageUrl && (
          <div className="relative aspect-auto">
            <Image
              src={moment.imageUrl}
              alt={moment.title}
              width={400}
              height={300}
              className="w-full h-auto object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-4">
          <span className="font-display text-[10px] text-foreground-muted">
            {moment.category}
          </span>
          <h2 className="font-body text-base mt-1 leading-snug group-hover:opacity-70 transition-opacity">
            {moment.title}
          </h2>
          {moment.creatorName && (
            <p className="font-display text-[10px] text-foreground-muted mt-2">
              {moment.creatorName}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
