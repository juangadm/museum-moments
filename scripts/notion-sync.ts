import { Client } from "@notionhq/client";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { extractDominantColor } from "../src/lib/color-extractor";

const prisma = new PrismaClient();

// Valid categories
const VALID_CATEGORIES = [
  "Branding",
  "Images",
  "Interfaces",
  "Objects",
  "Spaces",
  "Typography",
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Helper to extract text from Notion rich text
function getRichText(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) return "";
  return richText.map((t) => t.plain_text).join("");
}

// Helper to get property value based on type
function getPropertyValue(property: any): string {
  if (!property) return "";

  switch (property.type) {
    case "title":
      return getRichText(property.title);
    case "rich_text":
      return getRichText(property.rich_text);
    case "select":
      return property.select?.name || "";
    case "url":
      return property.url || "";
    case "files":
      if (property.files && property.files.length > 0) {
        const file = property.files[0];
        if (file.type === "file") {
          return file.file.url;
        } else if (file.type === "external") {
          return file.external.url;
        }
      }
      return "";
    default:
      return "";
  }
}

async function downloadAndUploadImage(
  imageUrl: string,
  filename: string
): Promise<string | null> {
  if (!imageUrl) return null;

  try {
    console.log(`    Downloading image...`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`    Failed to download: ${response.status}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";

    console.log(`    Uploading to Vercel Blob...`);
    const blob = await put(filename, Buffer.from(buffer), {
      access: "public",
      contentType,
    });

    console.log(`    Uploaded: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error(`    Image error:`, error);
    return null;
  }
}

async function main() {
  const notionApiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notionApiKey) {
    console.error("Missing NOTION_API_KEY in environment");
    console.log("\nAdd to your .env file:");
    console.log('NOTION_API_KEY="your-integration-secret"');
    process.exit(1);
  }

  if (!databaseId) {
    console.error("Missing NOTION_DATABASE_ID in environment");
    console.log("\nAdd to your .env file:");
    console.log('NOTION_DATABASE_ID="2e937989bf19807da84fc4bc61da4981"');
    process.exit(1);
  }

  const notion = new Client({ auth: notionApiKey });

  console.log("Fetching Notion database...\n");

  // Query the database
  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [{ timestamp: "created_time", direction: "ascending" }],
  });

  console.log(`Found ${response.results.length} entries\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const page of response.results) {
    if (!("properties" in page)) continue;

    const props = page.properties;

    // Extract fields - adjust property names to match your Notion database
    const title = getPropertyValue(props["Title"] || props["title"] || props["Name"]);
    const category = getPropertyValue(props["Category"] || props["category"]);
    const description = getPropertyValue(props["Description"] || props["description"]);
    const sourceUrl = getPropertyValue(props["Source URL"] || props["sourceUrl"] || props["URL"]);
    const creatorName = getPropertyValue(props["Creator Name"] || props["creatorName"] || props["Creator"]);
    const creatorUrl = getPropertyValue(props["Creator URL"] || props["creatorUrl"]);
    const imageUrl = getPropertyValue(props["Image"] || props["image"]);

    console.log(`Processing: ${title}`);

    // Validate required fields
    if (!title) {
      console.log(`  ⚠️  Skipping - no title`);
      skipped++;
      continue;
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      console.log(`  ⚠️  Skipping - invalid category: "${category}"`);
      skipped++;
      continue;
    }

    if (!description) {
      console.log(`  ⚠️  Skipping - no description`);
      skipped++;
      continue;
    }

    const slug = generateSlug(title);

    // Check if exists
    const existing = await prisma.moment.findUnique({ where: { slug } });
    if (existing) {
      console.log(`  ⏭️  Skipping - already exists`);
      skipped++;
      continue;
    }

    // Download and upload image to Vercel Blob
    let finalImageUrl: string | null = null;
    if (imageUrl) {
      const filename = `moments/${slug}-${Date.now()}.png`;
      finalImageUrl = await downloadAndUploadImage(imageUrl, filename);
    }

    // Extract dominant color
    let dominantColor: string | null = null;
    if (finalImageUrl) {
      console.log(`    Extracting color...`);
      try {
        dominantColor = await extractDominantColor(finalImageUrl);
      } catch {
        dominantColor = "#1a1a1a";
      }
    }

    try {
      await prisma.moment.create({
        data: {
          slug,
          title,
          category,
          description,
          sourceUrl: sourceUrl || creatorUrl || "",
          creatorName: creatorName || null,
          creatorUrl: creatorUrl || null,
          imageUrl: finalImageUrl,
          tags: JSON.stringify([]),
          dominantColor,
        },
      });

      console.log(`  ✅ Created: ${title}`);
      created++;
    } catch (error) {
      console.error(`  ❌ Error creating:`, error);
      errors++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Sync complete: ${created} created, ${skipped} skipped, ${errors} errors`);
  console.log(`========================================\n`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
