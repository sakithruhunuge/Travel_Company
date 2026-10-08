import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import TravelRequest from "@/models/TravelRequest";
import DriverGuide from "@/models/DriverGuide";

export const runtime = "nodejs";

// POST /api/driver/journey/start
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized: Sign in required" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    await dbConnect();

    const tenantId = await resolveTenantId(sessionUser);
    let booking: any = null;

    if (tenantId) {
      try {
        const db = tenantScope(tenantId);
        booking = await db.TravelRequest.findOne({ _id: bookingId });
      } catch (err) {
        console.warn("[StartJourney] Scoped lookup fallback:", err);
      }
    }

    if (!booking) {
      booking = await TravelRequest.findById(bookingId);
    }

    if (!booking) {
      return NextResponse.json({ error: "Tour record not found" }, { status: 404 });
    }

    booking.status = "active_tour";
    await booking.save();

    // Update crew member status to on_tour
    try {
      const matchConditions: any[] = [];
      if (sessionUser.id) matchConditions.push({ userId: sessionUser.id });
      if (sessionUser.email) matchConditions.push({ email: sessionUser.email });
      if (sessionUser.name) matchConditions.push({ name: sessionUser.name });
      if (booking.driver?.email) matchConditions.push({ email: booking.driver.email });
      if (booking.driver?.name) matchConditions.push({ name: booking.driver.name });
      if (booking.tourGuide?.email) matchConditions.push({ email: booking.tourGuide.email });
      if (booking.tourGuide?.name) matchConditions.push({ name: booking.tourGuide.name });

      if (matchConditions.length > 0) {
        const crewMember = await DriverGuide.findOne({ $or: matchConditions });
        if (crewMember) {
          crewMember.status = "on_tour";
          await crewMember.save();
        }
      }
    } catch (crewErr) {
      console.warn("[StartJourney] Failed to update driver status:", crewErr);
    }

    return NextResponse.json({
      success: true,
      message: "Journey started successfully! Tour is now active.",
      tour: booking,
    });
  } catch (error: any) {
    console.error("Start journey API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to start journey" },
      { status: 500 }
    );
  }
}
