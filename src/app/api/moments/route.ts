import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractDominantColor } from "@/lib/color-extractor";

export async function POST(request: Request) {
  try {
    // Verify admin password from header
    const password = request.headers.get("x-admin-password");
    const envPassword = process.env.ADMIN_PASSWORD;

    if (password !== envPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.category || !data.description || !data.imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields: title, category, description, imageUrl" },
        { status: 400 }
      );
    }

    // Generate slug from title if not provided
    const slug = data.slug || data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

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
    if (data.imageUrl) {
      try {
        dominantColor = await extractDominantColor(data.imageUrl);
      } catch (e) {
        console.error("Failed to extract color:", e);
        dominantColor = "#1a1a1a"; // fallback
      }
    }

    // Parse tags - accept array or comma-separated string
    let tags: string[] = [];
    if (Array.isArray(data.tags)) {
      tags = data.tags;
    } else if (typeof data.tags === "string") {
      tags = data.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }

    const moment = await db.moment.create({
      data: {
        slug,
        title: data.title,
        category: data.category,
        creatorName: data.creatorName || null,
        creatorUrl: data.creatorUrl || null,
        sourceUrl: data.sourceUrl || null,
        imageUrl: data.imageUrl,
        description: data.description,
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
