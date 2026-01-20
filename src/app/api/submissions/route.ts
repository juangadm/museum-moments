import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createSubmission, getSubmissions, getPendingSubmissionCount } from "@/lib/submissions";
import { validateSubmissionInput } from "@/lib/validation";
import { checkRateLimit, getRateLimitStatus } from "@/lib/rate-limit";

/**
 * POST /api/submissions - Create a new submission (public)
 */
export async function POST(request: Request) {
  try {
    // Get client IP
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.reason || "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Check honeypot - if filled, silently reject (don't tell bots they failed)
    if (body.honeypot && body.honeypot.trim().length > 0) {
      // Pretend success to bots
      return NextResponse.json({ success: true, id: "fake-id" });
    }

    // Validate input
    const validation = validateSubmissionInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Create submission
    const submission = await createSubmission({
      imageUrl: body.imageUrl,
      sourceUrl: body.sourceUrl,
      creatorName: body.creatorName,
      creatorUrl: body.creatorUrl || null,
      title: body.title || null,
      description: body.description || null,
      submitterNote: body.submitterNote || null,
      submitterIp: clientIp,
      honeypot: body.honeypot || null,
    });

    return NextResponse.json({
      success: true,
      id: submission.id,
    });
  } catch (error) {
    console.error("Create submission error:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/submissions - List submissions (admin only)
 */
export async function GET(request: Request) {
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

    // Parse query params
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as "PENDING" | "APPROVED" | "REJECTED" | null;

    // Get submissions
    const submissions = await getSubmissions(status ? { status } : undefined);
    const pendingCount = await getPendingSubmissionCount();

    return NextResponse.json({
      submissions,
      pendingCount,
    });
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
