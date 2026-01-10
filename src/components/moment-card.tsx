import Image from "next/image";
import Link from "next/link";
import type { Moment } from "@/lib/moments";

type MomentCardProps = {
  moment: Moment;
};

export function MomentCard({ moment }: MomentCardProps) {
  const year = moment.publishedAt.getFullYear();

  return (
    <Link href={`/m/${moment.slug}`} className="block break-inside-avoid mb-3 group">
      <article className="relative transition-opacity group-hover:opacity-95">
        {/* Image */}
        {moment.imageUrl && (
          <div className="relative border border-border overflow-hidden">
            <Image
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
}
