import { NextResponse } from "next/server";
import { getSubmissionById } from "@/lib/submissions";

/**
 * GET /api/submissions/[id] - Get a single submission (admin only)
 */
export async function GET(
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
    const submission = await getSubmissionById(id);

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Get submission error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}
