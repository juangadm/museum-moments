import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES, CATEGORY_DESCRIPTIONS } from "@/lib/constants";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  // Verify admin password
  const password = request.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Truncate HTML if too long (keep first ~100KB to stay within token limits)
    const truncatedHtml =
      html.length > 100000 ? html.substring(0, 100000) + "\n... [truncated]" : html;

    // Build category descriptions for the prompt
    const categoryList = CATEGORIES.map(
      (cat) => `- ${cat}: ${CATEGORY_DESCRIPTIONS[cat]}`
    ).join("\n");

    // Use Claude Haiku to extract information from the HTML
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are helping curate a design archive. Analyze this webpage HTML and extract information about the design work featured.

URL: ${url}
Domain: ${parsedUrl.hostname}

HTML:
${truncatedHtml}

Extract the following information:
1. **title**: The name of the specific design piece/project (NOT the site name or page title). Look for:
   - h1/h2 headings that name the work
   - Project titles in the content
   - If it's a portfolio piece, find the actual project name

2. **creator**: The designer, studio, or artist who created the work. Look for:
   - Author credits
   - Designer names in the content
   - Studio names
   - "Designed by" or "Created by" text
   - Do NOT use the website domain as the creator unless it's actually the creator's name

3. **year**: The year the work was created (if mentioned). Return just the number.
   - If only a decade is mentioned (e.g., "1990s"), return the decade start year (e.g., 1990)

4. **yearApproximate**: true if the year is approximate/decade-level, false if exact

5. **category**: Suggest ONE category from this list:
${categoryList}

6. **images**: Extract up to 5 main images from the page that could represent this work. Look for:
   - Main hero/featured images
   - Gallery images
   - Images in the main content area
   - Prefer large images (data-src, srcset high-res, og:image)
   - Exclude: icons, logos, navigation elements, tiny thumbnails, tracking pixels

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "title": "string or null",
  "creator": "string or null",
  "year": "number or null",
  "yearApproximate": "boolean",
  "category": "string or null",
  "images": ["url1", "url2"]
}`,
        },
      ],
    });

    // Extract the text response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Parse the JSON from the response
    const responseText = textBlock.text.trim();

    // Try to extract JSON object from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse extraction from response");
    }

    const extracted = JSON.parse(jsonMatch[0]);

    // Make image URLs absolute
    const images = (extracted.images || [])
      .filter((img: unknown): img is string => typeof img === "string" && img.length > 0)
      .map((img: string) => {
        if (img.startsWith("http")) return img;
        try {
          return new URL(img, url).href;
        } catch {
          return null;
        }
      })
      .filter((img: string | null): img is string => img !== null)
      .slice(0, 5);

    return NextResponse.json({
      title: extracted.title || null,
      creator: extracted.creator || null,
      year: extracted.year ? parseInt(String(extracted.year), 10) || null : null,
      yearApproximate: extracted.yearApproximate === true || extracted.yearApproximate === "true",
      category: extracted.category || null,
      images,
      sourceUrl: url,
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to scrape URL",
      },
      { status: 500 }
    );
  }
}
