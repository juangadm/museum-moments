import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

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
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const getMetaContent = (name: string): string | null => {
      return (
        $(`meta[property="${name}"]`).attr("content") ||
        $(`meta[name="${name}"]`).attr("content") ||
        null
      );
    };

    // Title: og:title > twitter:title > title tag > h1
    const title =
      getMetaContent("og:title") ||
      getMetaContent("twitter:title") ||
      $("title").text().trim() ||
      $("h1").first().text().trim() ||
      null;

    // Description: og:description > twitter:description > meta description
    const description =
      getMetaContent("og:description") ||
      getMetaContent("twitter:description") ||
      getMetaContent("description") ||
      null;

    // Site name / Creator: og:site_name > author > domain
    const siteName =
      getMetaContent("og:site_name") ||
      getMetaContent("author") ||
      parsedUrl.hostname.replace("www.", "") ||
      null;

    // Image: og:image > twitter:image
    const image =
      getMetaContent("og:image") ||
      getMetaContent("twitter:image") ||
      null;

    // Try to make image URL absolute if it's relative
    let imageUrl = image;
    if (image && !image.startsWith("http")) {
      try {
        imageUrl = new URL(image, url).href;
      } catch {
        imageUrl = image;
      }
    }

    return NextResponse.json({
      title: title ? cleanText(title) : null,
      description: description ? cleanText(description) : null,
      siteName: siteName ? cleanText(siteName) : null,
      imageUrl,
      sourceUrl: url,
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to scrape URL" },
      { status: 500 }
    );
  }
}

// Clean up text by removing extra whitespace
function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
