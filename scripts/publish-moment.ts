/**
 * Publish a drafted moment to the live site: upload its media through
 * /api/upload, then create it through /api/moments.
 *
 * Usage:
 *   npm run publish-moment -- captures/<host>/draft.json            # dry run: validate + preview
 *   npm run publish-moment -- captures/<host>/draft.json --publish  # actually publish
 *
 * Env (.env.local or .env):
 *   ADMIN_PASSWORD  Same password as /admin
 *   MM_SITE_URL     Defaults to https://museum-moments.com
 *
 * draft.json:
 *   {
 *     "title": "…", "category": "Interfaces", "description": "…",
 *     "sourceUrl": "https://…", "creatorName": "…", "creatorUrl": "https://…",
 *     "tags": ["color", "web"], "year": 2025, "yearApproximate": false,
 *     "media": "loop.mp4",          // path relative to draft.json
 *     "poster": "loop-poster.jpg"   // optional, used for the hover color of videos
 *   }
 */
import { config } from "dotenv";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CATEGORIES, type Category } from "../src/lib/constants";
import { generateSlug } from "../src/lib/utils";

config({ path: ".env.local" });
config();

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

// Vercel rejects request bodies over 4.5MB before they reach the upload route
const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;

type Draft = {
  title: string;
  category: string;
  description: string;
  sourceUrl: string;
  creatorName?: string;
  creatorUrl?: string;
  tags?: string[];
  year?: number;
  yearApproximate?: boolean;
  slug?: string;
  media: string;
  poster?: string;
};

async function dominantColor(file: string): Promise<string> {
  const { dominant } = await sharp(file).resize(100, 100, { fit: "inside" }).stats();
  return `#${[dominant.r, dominant.g, dominant.b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

async function main() {
  const draftPath = process.argv[2];
  const shouldPublish = process.argv.includes("--publish");
  if (!draftPath) {
    console.error("Usage: npm run publish-moment -- <draft.json> [--publish]");
    process.exit(1);
  }

  const draft: Draft = JSON.parse(readFileSync(draftPath, "utf8"));
  const baseDir = path.dirname(draftPath);
  const mediaPath = path.resolve(baseDir, draft.media);
  const mimeType = MIME_TYPES[path.extname(mediaPath).toLowerCase()];
  const errors: string[] = [];

  if (!draft.title) errors.push("title is required");
  if (!draft.description) errors.push("description is required");
  if (!draft.sourceUrl) errors.push("sourceUrl is required");
  if (!CATEGORIES.includes(draft.category as Category)) errors.push(`category must be one of ${CATEGORIES.join(", ")}`);
  if (!mimeType) errors.push(`unsupported media type: ${path.extname(mediaPath)}`);
  const size = statSync(mediaPath).size;
  if (size > MAX_UPLOAD_BYTES) errors.push(`media is ${(size / 1024 / 1024).toFixed(1)}MB; keep it under 4.5MB (shorter --seconds)`);
  if (errors.length) {
    console.error("Draft is not ready:\n  - " + errors.join("\n  - "));
    process.exit(1);
  }

  const isVideo = mimeType.startsWith("video/");
  const colorSource = isVideo ? (draft.poster ? path.resolve(baseDir, draft.poster) : null) : mediaPath;
  const color = colorSource ? await dominantColor(colorSource) : undefined;
  const slug = draft.slug || generateSlug(draft.title);
  const site = (process.env.MM_SITE_URL || "https://museum-moments.com").replace(/\/$/, "");

  console.log(`\n${draft.title}  [${draft.category}]`);
  console.log(`  ${site}/m/${slug}`);
  console.log(`  by ${draft.creatorName || "—"}  ·  ${draft.sourceUrl}`);
  console.log(`  media ${path.basename(mediaPath)} (${(size / 1024).toFixed(0)}KB)  color ${color || "auto"}`);
  console.log(`  tags ${(draft.tags || []).join(", ") || "(auto-generated)"}`);
  console.log(`\n  ${draft.description}\n`);

  if (!shouldPublish) {
    console.log("Dry run — re-run with --publish to post it.");
    return;
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error("ADMIN_PASSWORD is not set (.env.local or environment).");
    process.exit(1);
  }

  const form = new FormData();
  form.append("file", new Blob([readFileSync(mediaPath)], { type: mimeType }), `${slug}${path.extname(mediaPath)}`);
  const upload = await fetch(`${site}/api/upload`, {
    method: "POST",
    headers: { "x-admin-password": password },
    body: form,
  });
  if (!upload.ok) throw new Error(`Upload failed (${upload.status}): ${await upload.text()}`);
  const { url: imageUrl } = (await upload.json()) as { url: string };

  const create = await fetch(`${site}/api/moments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-password": password },
    body: JSON.stringify({
      title: draft.title,
      slug,
      category: draft.category,
      description: draft.description,
      sourceUrl: draft.sourceUrl,
      creatorName: draft.creatorName,
      creatorUrl: draft.creatorUrl,
      tags: draft.tags,
      year: draft.year,
      yearApproximate: draft.yearApproximate,
      dominantColor: color,
      imageUrl,
    }),
  });
  if (!create.ok) throw new Error(`Create failed (${create.status}): ${await create.text()}`);
  console.log(`Published → ${site}/m/${slug}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
