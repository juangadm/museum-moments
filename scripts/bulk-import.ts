import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

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

interface MomentRow {
  title: string;
  category: string;
  description: string;
  sourceUrl: string;
  creatorName?: string;
  creatorUrl?: string;
  tags?: string;
  imageUrl?: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function parseTSV(content: string): MomentRow[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("TSV must have header row and at least one data row");
  }

  // Parse header (case-insensitive)
  const headers = lines[0].split("\t").map((h) => h.trim().toLowerCase());

  // Required columns
  const requiredCols = ["title", "category", "description", "sourceurl"];
  for (const col of requiredCols) {
    if (!headers.includes(col)) {
      throw new Error(`Missing required column: ${col}`);
    }
  }

  // Map header indices
  const colIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    colIndex[h] = i;
  });

  const rows: MomentRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split("\t");
    const getValue = (key: string): string => {
      const idx = colIndex[key];
      return idx !== undefined ? (cols[idx] || "").trim() : "";
    };

    const title = getValue("title");
    const category = getValue("category");
    const description = getValue("description");
    const sourceUrl = getValue("sourceurl");

    // Validate required fields
    if (!title || !category || !description || !sourceUrl) {
      console.warn(`Row ${i + 1}: Skipping - missing required fields`);
      continue;
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      console.warn(
        `Row ${i + 1}: Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`
      );
      continue;
    }

    rows.push({
      title,
      category,
      description,
      sourceUrl,
      creatorName: getValue("creatorname") || undefined,
      creatorUrl: getValue("creatorurl") || undefined,
      tags: getValue("tags") || undefined,
      imageUrl: getValue("imageurl") || undefined,
    });
  }

  return rows;
}

async function main() {
  const inputFile = process.argv[2];

  if (!inputFile) {
    console.log(`
BULK IMPORT SCRIPT
==================

Usage: npx tsx scripts/bulk-import.ts <input-file.tsv>

Expected TSV format (tab-separated, first row is headers):

title    category    description    sourceUrl    creatorName    creatorUrl    tags    imageUrl
─────────────────────────────────────────────────────────────────────────────────────────────

Required columns:
  - title         The name of the moment
  - category      One of: Branding, Images, Interfaces, Objects, Spaces, Typography
  - description   2-4 sentences about why this is good design
  - sourceUrl     Link to the original work

Optional columns:
  - creatorName   Who made it
  - creatorUrl    Link to creator's website
  - tags          Comma-separated (e.g., "minimal, typography, saas")
  - imageUrl      Direct URL to hosted image

Tip: Copy from Google Sheets or Notion table → paste into a .tsv file
`);
    process.exit(0);
  }

  // Read input file
  const filePath = path.resolve(inputFile);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const rows = parseTSV(content);

  console.log(`\nParsed ${rows.length} valid moments from TSV\n`);

  if (rows.length === 0) {
    console.log("No valid rows to import.");
    process.exit(0);
  }

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const slug = generateSlug(row.title);

    // Check if exists
    const existing = await prisma.moment.findUnique({ where: { slug } });
    if (existing) {
      console.log(`⏭️  Skipping "${row.title}" - slug already exists`);
      skipped++;
      continue;
    }

    // Parse tags
    const tags = row.tags
      ? row.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    await prisma.moment.create({
      data: {
        slug,
        title: row.title,
        category: row.category,
        description: row.description,
        sourceUrl: row.sourceUrl,
        creatorName: row.creatorName || null,
        creatorUrl: row.creatorUrl || null,
        imageUrl: row.imageUrl || null,
        tags: JSON.stringify(tags),
      },
    });

    console.log(`✅ Created: ${row.title}`);
    created++;
  }

  console.log(`\n========================================`);
  console.log(`Import complete: ${created} created, ${skipped} skipped`);
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
