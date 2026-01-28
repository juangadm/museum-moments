import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  // Verify admin password
  const password = request.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, category } = await request.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `You are helping curate a design archive called "Museum Moments". Based on the following design piece, generate 4-6 relevant, specific tags.

Title: ${title || "Untitled"}
Category: ${category || "Unknown"}
Description: ${description}

Guidelines for tags:
- Be specific, not generic (e.g., "swiss-style" not just "design")
- Use lowercase with hyphens for multi-word tags
- Focus on: visual style, technique, era, mood, notable elements
- Examples of good tags: "brutalist", "hand-drawn", "90s-nostalgia", "editorial-grid", "vibrant-color", "minimalist-typography"

Return ONLY a JSON array of tag strings, nothing else. Example: ["tag-one", "tag-two", "tag-three"]`,
        },
      ],
    });

    // Extract the text response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Parse the JSON array from the response
    const responseText = textBlock.text.trim();

    // Try to extract JSON array from the response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse tags from response");
    }

    const tags = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(tags)) {
      throw new Error("Response is not an array");
    }

    // Validate and clean tags
    const cleanTags = tags
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.toLowerCase().trim())
      .filter((tag) => tag.length > 0 && tag.length <= 30)
      .slice(0, 8); // Max 8 tags

    return NextResponse.json({ tags: cleanTags });
  } catch (error) {
    console.error("Generate tags error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate tags" },
      { status: 500 }
    );
  }
}
