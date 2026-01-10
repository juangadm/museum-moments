import Image from "next/image";
import Link from "next/link";
import type { Moment } from "@/lib/moments";

type MomentCardProps = {
  moment: Moment;
};

export function MomentCard({ moment }: MomentCardProps) {
  const year = moment.publishedAt.getFullYear();

  return (
    <Link href={`/m/${moment.slug}`} className="block break-inside-avoid mb-6">
      <article className="relative">
        {/* Image */}
        {moment.imageUrl && (
          <div className="relative border border-border">
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

        {/* Museum caption */}
        <div className="mt-1.5 text-left">
          <div className="font-body text-[9.6px] leading-[11.52px] text-foreground">
            <div>{moment.title}, {year}</div>
            {moment.creatorName && <div>{moment.creatorName}</div>}
            <div>{moment.category}</div>
          </div>
        </div>
      </article>
    </Link>
  );
}
