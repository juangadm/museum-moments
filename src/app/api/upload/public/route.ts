import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { validateFileUpload, sanitizeFilename } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Public image upload endpoint for visitor submissions.
 * Rate limited to prevent abuse.
 */
export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIp, "upload");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.reason || "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.resetIn.hour),
            "X-RateLimit-Remaining-Hour": String(rateLimitResult.remaining.hour),
            "X-RateLimit-Remaining-Day": String(rateLimitResult.remaining.day),
          },
        }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type and size
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Sanitize filename with "submission-" prefix
    const timestamp = Date.now();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const filename = `submissions/submission-${timestamp}.${safeExt}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    return NextResponse.json({
      url: blob.url,
      remaining: rateLimitResult.remaining,
    });
  } catch (error) {
    console.error("Public upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
