import { db } from "./db";

// Custom error class for data layer errors
export class DataError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "DataError";
  }
}

// Safe JSON parse with fallback
function safeParseTagsArray(tags: string): string[] {
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is string => typeof t === "string");
    }
    return [];
  } catch {
    console.error("Failed to parse tags JSON:", tags);
    return [];
  }
}

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
    tags: safeParseTagsArray(m.tags),
    publishedAt: m.publishedAt,
    dominantColor: m.dominantColor,
  };
}

export async function getMoments(options?: {
  category?: string;
  search?: string;
}): Promise<Moment[]> {
  try {
    const where: { category?: string } = {};

    if (options?.category && options.category !== "All") {
      where.category = options.category;
    }

    const moments = await db.moment.findMany({
      where,
      orderBy: { publishedAt: "desc" },
    });

    let parsed = moments.map(parseMoment);

    // Client-side search for flexibility
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
  } catch (error) {
    throw new DataError("Failed to fetch moments", error);
  }
}

export async function getMomentBySlug(slug: string): Promise<Moment | null> {
  try {
    const moment = await db.moment.findUnique({
      where: { slug },
    });

    if (!moment) return null;

    return parseMoment(moment);
  } catch (error) {
    throw new DataError(`Failed to fetch moment: ${slug}`, error);
  }
}

export async function getAdjacentMoments(
  publishedAt: Date
): Promise<{ prev: MomentNav; next: MomentNav }> {
  try {
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
  } catch (error) {
    throw new DataError("Failed to fetch adjacent moments", error);
  }
}

export async function getRelatedMoments(
  currentId: string,
  tags: string[],
  category: string,
  limit: number = 3
): Promise<Moment[]> {
  try {
    // First try same category (more likely to be related)
    const sameCategoryMoments = await db.moment.findMany({
      where: {
        id: { not: currentId },
        category,
      },
      orderBy: { publishedAt: "desc" },
      take: 50, // Cap for performance
    });

    // If not enough in same category, get others
    const otherMoments = sameCategoryMoments.length < limit
      ? await db.moment.findMany({
          where: {
            id: { not: currentId },
            category: { not: category },
          },
          orderBy: { publishedAt: "desc" },
          take: 20,
        })
      : [];

    const allMoments = [...sameCategoryMoments, ...otherMoments];
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
  } catch (error) {
    throw new DataError("Failed to fetch related moments", error);
  }
}

// Type for moment updates (all fields optional except slug is excluded)
export type MomentUpdate = {
  title?: string;
  category?: string;
  creatorName?: string | null;
  creatorUrl?: string | null;
  sourceUrl?: string;
  imageUrl?: string;
  description?: string;
  tags?: string[];
};

export async function updateMoment(
  slug: string,
  data: MomentUpdate
): Promise<Moment> {
  try {
    // Check if moment exists
    const existing = await db.moment.findUnique({
      where: { slug },
    });

    if (!existing) {
      throw new DataError(`Moment not found: ${slug}`);
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.creatorName !== undefined) updateData.creatorName = data.creatorName;
    if (data.creatorUrl !== undefined) updateData.creatorUrl = data.creatorUrl;
    if (data.sourceUrl !== undefined) updateData.sourceUrl = data.sourceUrl;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl;
    }

    const updated = await db.moment.update({
      where: { slug },
      data: updateData,
    });

    return parseMoment(updated);
  } catch (error) {
    if (error instanceof DataError) throw error;
    throw new DataError(`Failed to update moment: ${slug}`, error);
  }
}
