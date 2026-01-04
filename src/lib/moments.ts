import { db } from "./db";

export type Moment = {
  id: string;
  slug: string;
  title: string;
  category: string;
  creatorName: string | null;
  creatorUrl: string | null;
  sourceUrl: string;
  imageUrl: string | null;
  description: string;
  tags: string[];
  publishedAt: Date;
  dominantColor: string | null;
};

export type MomentNav = {
  slug: string;
  title: string;
} | null;

function parseMoment(m: {
  id: string;
  slug: string;
  title: string;
  category: string;
  creatorName: string | null;
  creatorUrl: string | null;
  sourceUrl: string;
  imageUrl: string | null;
  description: string;
  tags: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ogTitle: string | null;
  ogSiteName: string | null;
  dominantColor: string | null;
}): Moment {
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    category: m.category,
    creatorName: m.creatorName,
    creatorUrl: m.creatorUrl,
    sourceUrl: m.sourceUrl,
    imageUrl: m.imageUrl,
    description: m.description,
    tags: JSON.parse(m.tags) as string[],
    publishedAt: m.publishedAt,
    dominantColor: m.dominantColor,
  };
}

export async function getMoments(options?: {
  category?: string;
  search?: string;
}): Promise<Moment[]> {
  const where: { category?: string; OR?: Array<{ title?: { contains: string }; description?: { contains: string } }> } = {};

  if (options?.category && options.category !== "All") {
    where.category = options.category;
  }

  const moments = await db.moment.findMany({
    where,
    orderBy: { publishedAt: "desc" },
  });

  let parsed = moments.map(parseMoment);

  // Client-side search since SQLite doesn't support case-insensitive contains well
  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    parsed = parsed.filter(
      (m: Moment) =>
        m.title.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower) ||
        m.tags.some((t: string) => t.toLowerCase().includes(searchLower))
    );
  }

  return parsed;
}

export async function getMomentBySlug(slug: string): Promise<Moment | null> {
  const moment = await db.moment.findUnique({
    where: { slug },
  });

  if (!moment) return null;

  return parseMoment(moment);
}

export async function getAdjacentMoments(
  publishedAt: Date
): Promise<{ prev: MomentNav; next: MomentNav }> {
  const [prev, next] = await Promise.all([
    db.moment.findFirst({
      where: { publishedAt: { gt: publishedAt } },
      orderBy: { publishedAt: "asc" },
      select: { slug: true, title: true },
    }),
    db.moment.findFirst({
      where: { publishedAt: { lt: publishedAt } },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true },
    }),
  ]);

  return { prev, next };
}

export async function getRelatedMoments(
  currentId: string,
  tags: string[],
  category: string,
  limit: number = 3
): Promise<Moment[]> {
  // First try to find moments with shared tags
  const allMoments = await db.moment.findMany({
    where: {
      id: { not: currentId },
    },
    orderBy: { publishedAt: "desc" },
  });

  const parsed = allMoments.map(parseMoment);

  // Score by shared tags
  const scored = parsed.map((m: Moment) => {
    const sharedTags = m.tags.filter((t: string) => tags.includes(t)).length;
    const sameCategory = m.category === category ? 1 : 0;
    return { moment: m, score: sharedTags * 2 + sameCategory };
  });

  // Sort by score, then by date
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.moment.publishedAt.getTime() - a.moment.publishedAt.getTime();
  });

  return scored.slice(0, limit).map((s) => s.moment);
}
