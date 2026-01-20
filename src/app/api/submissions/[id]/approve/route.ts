import { NextResponse } from "next/server";
import { approveSubmission, getSubmissionById, SubmissionError } from "@/lib/submissions";
import { extractDominantColor } from "@/lib/color-extractor";
import { generateSlug } from "@/lib/utils";
import { validateMomentInput, VALID_CATEGORIES } from "@/lib/validation";
import { db } from "@/lib/db";

/**
 * POST /api/submissions/[id]/approve - Approve a submission and create a moment (admin only)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin password
    const password = request.headers.get("x-admin-password");
    const envPassword = process.env.ADMIN_PASSWORD;

    if (!envPassword) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (password !== envPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get the submission first
    const submission = await getSubmissionById(id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.status !== "PENDING") {
      return NextResponse.json(
        { error: `Submission already ${submission.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Validate required fields for moment creation
    const { title, category, description, tags } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    // Generate slug from title
    let slug = generateSlug(title);

    // Ensure slug is unique
    let slugCounter = 0;
    let finalSlug = slug;
    while (true) {
      const existing = await db.moment.findUnique({ where: { slug: finalSlug } });
      if (!existing) break;
      slugCounter++;
      finalSlug = `${slug}-${slugCounter}`;
    }

    // Extract dominant color from the submission's image
    const dominantColor = await extractDominantColor(submission.imageUrl);

    // Process tags
    const processedTags = Array.isArray(tags)
      ? tags.filter((t): t is string => typeof t === "string")
      : typeof tags === "string"
        ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

    // Approve the submission and create the moment
    const result = await approveSubmission(id, {
      slug: finalSlug,
      title: title.trim(),
      category,
      description: description.trim(),
      tags: processedTags,
      dominantColor,
    });

    return NextResponse.json({
      success: true,
      submission: result.submission,
      momentId: result.momentId,
      momentSlug: finalSlug,
    });
  } catch (error) {
    console.error("Approve submission error:", error);

    if (error instanceof SubmissionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to approve submission" },
      { status: 500 }
    );
  }
}
