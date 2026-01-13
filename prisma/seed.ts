import { PrismaClient } from "@prisma/client";
import { extractDominantColor } from "../src/lib/color-extractor";

const prisma = new PrismaClient();

const moments = [
  {
    slug: "linear-2024-release-page",
    title: "Linear 2024 Release Page",
    category: "Interfaces",
    creatorName: "Linear",
    creatorUrl: "https://linear.app",
    sourceUrl: "https://linear.app/releases/2024-01",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    description:
      "Linear's release pages are a masterclass in restraint. The typography hierarchy is perfect — massive release numbers, tight spacing, and just enough color to guide the eye. No noise, no decoration, just pure information architecture.",
    tags: JSON.stringify(["product", "typography", "dark-mode", "saas"]),
  },
  {
    slug: "stripe-press-books",
    title: "Stripe Press Book Covers",
    category: "Branding",
    creatorName: "Stripe Press",
    creatorUrl: "https://press.stripe.com",
    sourceUrl: "https://press.stripe.com",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80",
    description:
      "Every Stripe Press book cover follows the same grid but feels entirely unique. The constraint breeds creativity — bold colors, geometric shapes, and titles that demand attention. Publishing as design statement.",
    tags: JSON.stringify(["books", "editorial", "geometric", "color"]),
  },
  {
    slug: "teenage-engineering-op-1",
    title: "Teenage Engineering OP-1 Field",
    category: "Objects",
    creatorName: "Teenage Engineering",
    creatorUrl: "https://teenage.engineering",
    sourceUrl: "https://teenage.engineering/products/op-1-field",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    description:
      "Hardware that looks like it was designed for a Wes Anderson film. The interface is pure joy — chunky knobs, a screen that shows only what matters, and a product page that lets the object speak for itself.",
    tags: JSON.stringify(["hardware", "minimal", "interface", "music"]),
  },
  {
    slug: "monocle-magazine-covers",
    title: "Monocle Magazine Covers",
    category: "Images",
    creatorName: "Monocle",
    creatorUrl: "https://monocle.com",
    sourceUrl: "https://monocle.com/magazine/",
    imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&q=80",
    description:
      "Monocle's covers are editorial confidence distilled. The masthead never moves. The photography is always singular and decisive. It's a magazine that knows exactly what it is and refuses to shout.",
    tags: JSON.stringify(["editorial", "photography", "magazine", "print"]),
  },
  {
    slug: "muji-product-photography",
    title: "MUJI Product Photography",
    category: "Images",
    creatorName: "MUJI",
    creatorUrl: "https://muji.com",
    sourceUrl: "https://www.muji.com/us/",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    description:
      "MUJI photographs products like they're already in your home. Soft shadows, neutral backgrounds, and compositions that emphasize utility over desire. Anti-advertising as the ultimate advertisement.",
    tags: JSON.stringify(["retail", "minimal", "japanese", "lifestyle"]),
  },
  {
    slug: "apple-typography-system",
    title: "Apple's San Francisco Type System",
    category: "Typography",
    creatorName: "Apple",
    creatorUrl: "https://apple.com",
    sourceUrl: "https://developer.apple.com/fonts/",
    imageUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
    description:
      "San Francisco is invisible until you need it. The optical sizes, the variable weights, the way it scales from watch to billboard — it's infrastructure design. Typography that serves rather than performs.",
    tags: JSON.stringify(["typeface", "system", "variable-font", "tech"]),
  },
  {
    slug: "arc-browser-spaces",
    title: "Arc Browser Spaces",
    category: "Interfaces",
    creatorName: "The Browser Company",
    creatorUrl: "https://arc.net",
    sourceUrl: "https://arc.net",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    description:
      "Arc reimagined browser chrome as a living sidebar. Spaces give you context without complexity. The gradients, the sidebar that breathes, the way it gets out of your way — software that respects your attention.",
    tags: JSON.stringify(["browser", "productivity", "interface", "color"]),
  },
  {
    slug: "notion-empty-states",
    title: "Notion's Empty States",
    category: "Images",
    creatorName: "Notion",
    creatorUrl: "https://notion.so",
    sourceUrl: "https://notion.so",
    imageUrl: "https://images.unsplash.com/photo-1618556450994-a163b1f2575f?w=800&q=80",
    description:
      "Notion's empty states are invitations, not dead ends. Each illustration has personality without being precious. They say 'this space is yours' in a way that actually makes you want to fill it.",
    tags: JSON.stringify(["illustration", "onboarding", "character", "saas"]),
  },
  {
    slug: "aesop-store-interiors",
    title: "Aesop Store Interiors",
    category: "Branding",
    creatorName: "Aesop",
    creatorUrl: "https://aesop.com",
    sourceUrl: "https://www.aesop.com/us/r/aesop-spaces",
    imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
    description:
      "Every Aesop store is different yet unmistakably Aesop. Local materials, local architects, same soul. The brown bottles become sculpture. The sinks become ritual. Retail as slow experience.",
    tags: JSON.stringify(["retail", "architecture", "experiential", "luxury"]),
  },
  {
    slug: "vercel-ship-conference",
    title: "Vercel Ship 2024",
    category: "Spaces",
    creatorName: "Vercel",
    creatorUrl: "https://vercel.com",
    sourceUrl: "https://vercel.com/ship",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    description:
      "Tech conference branding that doesn't look like every other tech conference. The Ship identity is bold, the stage design is theatrical, and the website loads faster than you can blink. Practice what you preach.",
    tags: JSON.stringify(["conference", "web", "identity", "tech"]),
  },
  {
    slug: "dieter-rams-ten-principles",
    title: "Dieter Rams: Ten Principles",
    category: "Objects",
    creatorName: "Dieter Rams",
    creatorUrl: null,
    sourceUrl: "https://www.vitsoe.com/us/about/good-design",
    imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80",
    description:
      "Good design is as little design as possible. Rams wrote it in the 1970s and it's still the north star. These ten principles aren't rules — they're a way of seeing. Return to them often.",
    tags: JSON.stringify(["principles", "industrial-design", "classic", "philosophy"]),
  },
];

async function main() {
  console.log("Seeding database...");

  for (const moment of moments) {
    // Extract dominant color from image
    let dominantColor: string | null = null;
    if (moment.imageUrl) {
      console.log(`Extracting color from: ${moment.slug}`);
      dominantColor = await extractDominantColor(moment.imageUrl);
      console.log(`  → ${dominantColor}`);
    }

    await prisma.moment.upsert({
      where: { slug: moment.slug },
      update: { ...moment, dominantColor },
      create: { ...moment, dominantColor },
    });
  }

  console.log(`Seeded ${moments.length} moments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
