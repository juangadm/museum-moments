import "dotenv/config";
import { Client } from "@notionhq/client";
import pg from "pg";
import { put } from "@vercel/blob";
import { extractDominantColor } from "../src/lib/color-extractor";

const { Pool } = pg;

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

function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `c${timestamp}${random}`;
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
  const databaseUrl = process.env.DATABASE_URL;

  if (!notionApiKey) {
    console.error("Missing NOTION_API_KEY");
    process.exit(1);
  }
  if (!databaseId) {
    console.error("Missing NOTION_DATABASE_ID");
    process.exit(1);
  }
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const notion = new Client({ auth: notionApiKey });

  try {
    // First, clear existing moments
    console.log("Clearing existing moments...");
    const deleteResult = await pool.query('DELETE FROM "Moment"');
    console.log(`Deleted ${deleteResult.rowCount} existing moments.\n`);

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
      const existing = await pool.query('SELECT id FROM "Moment" WHERE slug = $1', [slug]);
      if (existing.rows.length > 0) {
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
        const id = generateCuid();
        const now = new Date();

        await pool.query(
          `INSERT INTO "Moment" (id, slug, title, category, description, "sourceUrl", "creatorName", "creatorUrl", "imageUrl", tags, "dominantColor", "publishedAt", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            id,
            slug,
            title,
            category,
            description,
            sourceUrl || creatorUrl || "",
            creatorName || null,
            creatorUrl || null,
            finalImageUrl,
            JSON.stringify([]),
            dominantColor,
            now,
            now,
            now,
          ]
        );

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
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
