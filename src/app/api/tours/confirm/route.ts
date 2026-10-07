import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

// Helper to generate sequential or unique tour ID: TRV-YYYYMM-XXXX
function generateTourId(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TRV-${yearMonth}-${randomSuffix}`;
}

// POST /api/tours/confirm
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = await resolveTenantId(sessionUser);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context missing" }, { status: 400 });
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    const booking = await db.TravelRequest.findOne({ _id: bookingId });
    if (!booking) {
      return NextResponse.json({ error: "Tour booking not found" }, { status: 404 });
    }

    // If already has tourId, don't re-generate
    const tourId = booking.tourId || generateTourId();

    // Advance status to "confirmed"
    booking.tourId = tourId;
    booking.status = "confirmed";
    if (booking.quotation) {
      booking.quotation.status = "accepted";
    }
    await booking.save();

    return NextResponse.json({
      success: true,
      tourId,
      status: booking.status,
      message: `Tour successfully confirmed with ID: ${tourId}`,
      booking,
    });
  } catch (error: any) {
    console.error("Tour confirmation error:", error);
    return NextResponse.json({ error: error?.message || "Failed to confirm tour" }, { status: 500 });
  }
}
