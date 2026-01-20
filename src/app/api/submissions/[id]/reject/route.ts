import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { rejectSubmission, deleteSubmission, getSubmissionById, SubmissionError } from "@/lib/submissions";

/**
 * POST /api/submissions/[id]/reject - Reject a submission (admin only)
 * Deletes the submission and its uploaded image.
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
    const body = await request.json().catch(() => ({}));
    const reviewNote = body.reviewNote || null;

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

    // Mark as rejected first
    await rejectSubmission(id, reviewNote);

    // Try to delete the uploaded image from Vercel Blob
    if (submission.imageUrl) {
      try {
        await del(submission.imageUrl);
      } catch (deleteError) {
        // Log but don't fail if image deletion fails
        console.error("Failed to delete submission image:", deleteError);
      }
    }

    // Delete the submission record
    await deleteSubmission(id);

    return NextResponse.json({
      success: true,
      deleted: id,
    });
  } catch (error) {
    console.error("Reject submission error:", error);

    if (error instanceof SubmissionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to reject submission" },
      { status: 500 }
    );
  }
}
