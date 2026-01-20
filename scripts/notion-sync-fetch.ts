import "dotenv/config";
import { put } from "@vercel/blob";

const SITE_URL = process.env.SITE_URL || "https://museum-moments.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const VALID_CATEGORIES = [
  "Branding",
  "Images",
  "Interfaces",
  "Objects",
  "Spaces",
  "Typography",
];

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
  if (!BLOB_READ_WRITE_TOKEN) {
    console.error("Missing BLOB_READ_WRITE_TOKEN");
    process.exit(1);
  }

  console.log("Fetching Notion database...");

  const response = await fetch(
    `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sorts: [{ timestamp: "created_time", direction: "ascending" }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Notion error: ${await response.text()}`);
  }

  const data = await response.json();
  console.log(`Found ${data.results.length} entries\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const page of data.results) {
    const props = page.properties;

    // Extract fields from Notion
    const title =
      props.Title?.title?.[0]?.plain_text ||
      props.Name?.title?.[0]?.plain_text ||
      "";
    const category = props.Category?.select?.name || "";
    const description = props.Description?.rich_text?.[0]?.plain_text || "";
    const sourceUrl = props["Source URL"]?.url || props.URL?.url || "";
    const creatorName =
      props["Creator Name"]?.rich_text?.[0]?.plain_text ||
      props.Creator?.rich_text?.[0]?.plain_text ||
      "";
    const creatorUrl = props["Creator URL"]?.url || "";
    const imageFile = props.Image?.files?.[0];
    const notionImageUrl =
      imageFile?.file?.url || imageFile?.external?.url || "";

    console.log(`Processing: ${title}`);

    // Validate required fields
    if (!title) {
      console.log(`  ⚠️ Skipping - no title`);
      skipped++;
      continue;
    }
    if (!VALID_CATEGORIES.includes(category)) {
      console.log(`  ⚠️ Skipping - invalid category: "${category}"`);
      skipped++;
      continue;
    }
    if (!description) {
      console.log(`  ⚠️ Skipping - no description`);
      skipped++;
      continue;
    }

    // Upload image to Vercel Blob
    let imageUrl: string | undefined;
    if (notionImageUrl) {
      console.log(`  Downloading image...`);
      try {
        const imgRes = await fetch(notionImageUrl);
        if (!imgRes.ok) {
          console.log(`  ❌ Download failed: ${imgRes.status}`);
        } else {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const contentType = imgRes.headers.get("content-type") || "image/png";
          const ext = contentType.includes("jpeg") ? "jpg" : "png";
          const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}.${ext}`;

          console.log(`  Uploading to Vercel Blob...`);
          const blob = await put(filename, buffer, {
            access: "public",
            token: BLOB_READ_WRITE_TOKEN,
            contentType,
          });
          imageUrl = blob.url;
          console.log(`  ✅ Uploaded: ${imageUrl}`);
        }
      } catch (err) {
        console.log(`  ❌ Image error: ${err}`);
      }
    }

    // Create moment via API
    const createRes = await fetch(`${SITE_URL}/api/moments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": ADMIN_PASSWORD,
      },
      body: JSON.stringify({
        title,
        category,
        description,
        sourceUrl,
        creatorName,
        creatorUrl,
        imageUrl,
      }),
    });

    if (createRes.ok) {
      console.log(`  ✅ Created`);
      created++;
    } else {
      const error = await createRes.text();
      console.log(`  ❌ Failed: ${error}`);
      errors++;
    }
    console.log("");
  }

  console.log(`========================================`);
  console.log(`Sync complete: ${created} created, ${skipped} skipped, ${errors} errors`);
  console.log(`========================================\n`);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
