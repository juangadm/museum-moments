import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
