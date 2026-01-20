import "dotenv/config";
import { Client } from "@notionhq/client";

const SITE_URL = process.env.SITE_URL || "https://museum-moments.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

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

function getRichText(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) return "";
  return richText.map((t) => t.plain_text).join("");
}

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

async function uploadImage(imageUrl: string, slug: string): Promise<string | null> {
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
    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";

    // Create FormData with the file
    const formData = new FormData();
    const blob = new Blob([buffer], { type: contentType });
    formData.append("file", blob, `${slug}-${Date.now()}.${ext}`);

    console.log(`    Uploading to Vercel Blob via API...`);
    const uploadResponse = await fetch(`${SITE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.warn(`    Upload failed: ${error}`);
      return null;
    }

    const result = await uploadResponse.json();
    console.log(`    Uploaded: ${result.url}`);
    return result.url;
  } catch (error) {
    console.error(`    Image error:`, error);
    return null;
  }
}

async function createMoment(data: {
  title: string;
  category: string;
  description: string;
  sourceUrl: string;
  creatorName?: string;
  creatorUrl?: string;
  imageUrl?: string;
}): Promise<boolean> {
  try {
    const response = await fetch(`${SITE_URL}/api/moments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": ADMIN_PASSWORD!,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 409) {
        console.log(`  ⏭️  Skipping - already exists`);
        return false;
      }
      console.error(`  ❌ API error:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`  ❌ Request error:`, error);
    return false;
  }
}

async function clearAllMoments(): Promise<number> {
  const response = await fetch(`${SITE_URL}/api/moments`, {
    method: "DELETE",
    headers: {
      "x-admin-password": ADMIN_PASSWORD!,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to clear moments: ${response.status}`);
  }

  const result = await response.json();
  return result.deleted;
}

async function main() {
  if (!NOTION_API_KEY) {
    console.error("Missing NOTION_API_KEY");
    process.exit(1);
  }
  if (!NOTION_DATABASE_ID) {
    console.error("Missing NOTION_DATABASE_ID");
    process.exit(1);
  }
  if (!ADMIN_PASSWORD) {
    console.error("Missing ADMIN_PASSWORD");
    process.exit(1);
  }

  const notion = new Client({ auth: NOTION_API_KEY });

  // Clear existing moments
  console.log("Clearing existing moments...");
  try {
    const deleted = await clearAllMoments();
    console.log(`Deleted ${deleted} existing moments.\n`);
  } catch (error) {
    console.error("Failed to clear moments:", error);
    console.log("Continuing with sync anyway...\n");
  }

  console.log("Fetching Notion database...\n");

  const response = await notion.databases.query({
    database_id: NOTION_DATABASE_ID,
    sorts: [{ timestamp: "created_time", direction: "ascending" }],
  });

  console.log(`Found ${response.results.length} entries\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const page of response.results) {
    if (!("properties" in page)) continue;

    const props = page.properties;

    const title = getPropertyValue(props["Title"] || props["title"] || props["Name"]);
    const category = getPropertyValue(props["Category"] || props["category"]);
    const description = getPropertyValue(props["Description"] || props["description"]);
    const sourceUrl = getPropertyValue(props["Source URL"] || props["sourceUrl"] || props["URL"]);
    const creatorName = getPropertyValue(props["Creator Name"] || props["creatorName"] || props["Creator"]);
    const creatorUrl = getPropertyValue(props["Creator URL"] || props["creatorUrl"]);
    const notionImageUrl = getPropertyValue(props["Image"] || props["image"]);

    console.log(`Processing: ${title}`);

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

    // Upload image if present
    let imageUrl: string | undefined;
    if (notionImageUrl) {
      const uploaded = await uploadImage(notionImageUrl, slug);
      if (uploaded) {
        imageUrl = uploaded;
      }
    }

    const success = await createMoment({
      title,
      category,
      description,
      sourceUrl: sourceUrl || creatorUrl || "",
      creatorName: creatorName || undefined,
      creatorUrl: creatorUrl || undefined,
      imageUrl,
    });

    if (success) {
      console.log(`  ✅ Created: ${title}`);
      created++;
    } else {
      errors++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Sync complete: ${created} created, ${skipped} skipped, ${errors} errors`);
  console.log(`========================================\n`);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
