import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateMoment, DataError } from "@/lib/moments";
import { validateMomentUpdate } from "@/lib/validation";

// DELETE /api/moments/[slug] - Delete a single moment (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const password = request.headers.get("x-admin-password");
    const envPassword = process.env.ADMIN_PASSWORD;

    if (!envPassword) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (password !== envPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const moment = await db.moment.findUnique({ where: { slug } });
    if (!moment) {
      return NextResponse.json({ error: "Moment not found" }, { status: 404 });
    }

    await db.moment.delete({ where: { slug } });

    return NextResponse.json({ success: true, deleted: slug });
  } catch (error) {
    console.error("Delete moment error:", error);
    return NextResponse.json({ error: "Failed to delete moment" }, { status: 500 });
  }
}

// PATCH /api/moments/[slug] - Update a moment (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const password = request.headers.get("x-admin-password");
    const envPassword = process.env.ADMIN_PASSWORD;

    if (!envPassword) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (password !== envPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();

    // Validate the update payload
    const validation = validateMomentUpdate(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Process tags if provided (convert to array if string)
    const updateData = { ...body };
    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === "string"
          ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
          : [];
    }

    // Update the moment
    const updated = await updateMoment(slug, updateData);

    return NextResponse.json({ success: true, moment: updated });
  } catch (error) {
    console.error("Update moment error:", error);

    if (error instanceof DataError) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: "Moment not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Failed to update moment" }, { status: 500 });
  }
}
