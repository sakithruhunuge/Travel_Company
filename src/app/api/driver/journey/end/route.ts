import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import TravelRequest from "@/models/TravelRequest";
import DriverGuide from "@/models/DriverGuide";

export const runtime = "nodejs";

// POST /api/driver/journey/end
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized: Sign in required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      bookingId,
      endJourneyNotes = "",
      endJourneyOdometer,
      endJourneyDropOffLocation = "",
    } = body;

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
        console.warn("[EndJourney] Scoped lookup fallback:", err);
      }
    }

    if (!booking) {
      booking = await TravelRequest.findById(bookingId);
    }

    if (!booking) {
      return NextResponse.json({ error: "Tour record not found" }, { status: 404 });
    }

    // Mark status as completed and record ending metadata
    booking.status = "completed";
    booking.completedAt = new Date();

    if (typeof endJourneyNotes === "string" && endJourneyNotes.trim()) {
      booking.endJourneyNotes = endJourneyNotes.trim();
    }
    if (endJourneyOdometer !== undefined && endJourneyOdometer !== "" && !isNaN(Number(endJourneyOdometer))) {
      booking.endJourneyOdometer = Number(endJourneyOdometer);
    }
    if (typeof endJourneyDropOffLocation === "string" && endJourneyDropOffLocation.trim()) {
      booking.endJourneyDropOffLocation = endJourneyDropOffLocation.trim();
    }

    await booking.save();

    // Update crew member status and active tours count
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
          if (typeof crewMember.activeToursCount === "number" && crewMember.activeToursCount > 0) {
            crewMember.activeToursCount = Math.max(0, crewMember.activeToursCount - 1);
          }
          if (crewMember.status === "on_tour") {
            crewMember.status = "available";
          }
          await crewMember.save();
        }
      }
    } catch (crewErr) {
      console.warn("[EndJourney] Failed to update driver status:", crewErr);
    }

    return NextResponse.json({
      success: true,
      message: "Journey successfully ended and saved in history.",
      tour: booking,
    });
  } catch (error: any) {
    console.error("End journey API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to end journey" },
      { status: 500 }
    );
  }
}
