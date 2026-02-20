import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

const db = new PrismaClient();
const anthropic = new Anthropic();

async function backfillYears() {
  const moments = await db.moment.findMany({
    where: {
      year: null,
      sourceUrl: { not: "" },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      sourceUrl: true,
    },
  });

  console.log(`Found ${moments.length} moments without year data.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const moment of moments) {
    console.log(`[${updated + skipped + failed + 1}/${moments.length}] ${moment.title}`);
    console.log(`  URL: ${moment.sourceUrl}`);

    try {
      // Fetch the page HTML
      const response = await fetch(moment.sourceUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        console.log(`  SKIP: HTTP ${response.status}`);
        skipped++;
        continue;
      }

      const html = await response.text();
      const truncatedHtml =
        html.length > 50000 ? html.substring(0, 50000) + "\n... [truncated]" : html;

      // Ask Claude Haiku to extract year
      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: `Extract the year this design work was created from the page below.

Title: ${moment.title}
URL: ${moment.sourceUrl}

HTML:
${truncatedHtml}

Return ONLY valid JSON:
{
  "year": <number or null>,
  "yearApproximate": <boolean>
}

Rules:
- "year" is the creation year as a number, or null if not found
- If only a decade is mentioned (e.g. "1990s"), return the decade start (1990) and set yearApproximate to true
- If an exact year is found, set yearApproximate to false
- Do NOT guess — only return a year if it's explicitly stated on the page`,
          },
        ],
      });

      const textBlock = message.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        console.log("  SKIP: No text response");
        skipped++;
        await sleep(1000);
        continue;
      }

      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log("  SKIP: No JSON in response");
        skipped++;
        await sleep(1000);
        continue;
      }

      const extracted = JSON.parse(jsonMatch[0]);
      const year = extracted.year ? parseInt(String(extracted.year), 10) : null;

      if (!year || isNaN(year) || year < 1000 || year > new Date().getFullYear() + 1) {
        console.log("  SKIP: No valid year found");
        skipped++;
        await sleep(1000);
        continue;
      }

      const yearApproximate = extracted.yearApproximate === true;

      await db.moment.update({
        where: { id: moment.id },
        data: { year, yearApproximate },
      });

      console.log(`  UPDATED: ${year}${yearApproximate ? "s (approximate)" : ""}`);
      updated++;
    } catch (error) {
      console.log(`  FAILED: ${error instanceof Error ? error.message : "Unknown error"}`);
      failed++;
    }

    // Rate limit: 1s between requests
    await sleep(1000);
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
  await db.$disconnect();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

backfillYears().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
