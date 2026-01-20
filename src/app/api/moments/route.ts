import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractDominantColor } from "@/lib/color-extractor";
import { validateMomentInput } from "@/lib/validation";
import { generateTags } from "@/lib/auto-tagger";
import { generateSlug } from "@/lib/utils";

// DELETE /api/moments - Clear all moments (admin only)
export async function DELETE(request: Request) {
  try {
    const password = request.headers.get("x-admin-password");
    const envPassword = process.env.ADMIN_PASSWORD;

    if (!envPassword) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (password !== envPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db.moment.deleteMany({});

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error("Delete all moments error:", error);
    return NextResponse.json({ error: "Failed to delete moments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Verify admin password from header
    const password = request.headers.get("x-admin-password");
    const envPassword = process.env.ADMIN_PASSWORD;

    if (!envPassword) {
      console.error("ADMIN_PASSWORD not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (password !== envPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let data: Record<string, unknown>;
    try {
      data = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const validation = validateMomentInput(data);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Type assertions are safe after validation
    const title = data.title as string;
    const category = data.category as string;
    const description = data.description as string;
    const imageUrl = data.imageUrl as string;
    const creatorName = (data.creatorName as string) || null;
    const creatorUrl = (data.creatorUrl as string) || null;
    const sourceUrl = (data.sourceUrl as string) || "";

    // Generate slug from title if not provided
    const slug = (data.slug as string) || generateSlug(title);

    // Check if slug already exists
    const existing = await db.moment.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A moment with this slug already exists" },
        { status: 409 }
      );
    }

    // Extract dominant color from image
    let dominantColor: string | null = null;
    try {
      dominantColor = await extractDominantColor(imageUrl);
    } catch (e) {
      console.error("Failed to extract color:", e);
      dominantColor = "#1a1a1a"; // fallback
    }

    // Parse tags - accept array or comma-separated string
    let tags: string[] = [];
    if (Array.isArray(data.tags)) {
      tags = data.tags.filter((t): t is string => typeof t === "string");
    } else if (typeof data.tags === "string") {
      tags = data.tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    // Auto-generate tags if none provided
    if (tags.length === 0) {
      try {
        tags = await generateTags(description, category);
      } catch (e) {
        console.error("Auto-tagging failed:", e);
        // Continue without tags
      }
    }

    const moment = await db.moment.create({
      data: {
        slug,
        title,
        category,
        creatorName,
        creatorUrl,
        sourceUrl,
        imageUrl,
        description,
        tags: JSON.stringify(tags),
        dominantColor,
      },
    });

    return NextResponse.json({ success: true, moment });
  } catch (error) {
    console.error("Create moment error:", error);
    return NextResponse.json(
      { error: "Failed to create moment" },
      { status: 500 }
    );
  }
}
