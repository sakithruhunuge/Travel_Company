import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import TravelRequest from "@/models/TravelRequest";
import DriverGuide from "@/models/DriverGuide";

export const runtime = "nodejs";

// GET /api/driver/tours?identifier=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let identifier = searchParams.get("identifier")?.trim() || "";

    await dbConnect();

    // Dynamically retrieve all registered crew members for selection
    const allCrew = await DriverGuide.find({}).sort({ name: 1 }).lean();

    // Check user session if identifier not explicitly provided
    if (!identifier) {
      const session = await getServerSession(authOptions);
      const sessionUser = session?.user as any;
      if (sessionUser?.name || sessionUser?.email) {
        identifier = sessionUser.name || sessionUser.email;
      } else if (allCrew.length > 0) {
        identifier = allCrew[0].name;
      }
    }

    // Find driver/guide profile from database
    let crewMember: any = null;
    if (identifier) {
      crewMember = await DriverGuide.findOne({
        $or: [
          { email: identifier },
          { phone: identifier },
          { licenseNumber: identifier },
          { name: new RegExp(identifier, "i") },
        ],
      }).lean();
    }

    // Query tours where this driver or guide is assigned
    const query: any = {};
    if (identifier) {
      query.$or = [
        { "driver.name": new RegExp(identifier, "i") },
        { "driver.email": identifier },
        { "driver.phone": identifier },
        { "tourGuide.name": new RegExp(identifier, "i") },
        { "tourGuide.email": identifier },
      ];
    } else {
      query.$or = [{ driver: { $ne: null } }, { tourGuide: { $ne: null } }];
    }

    const tours = await TravelRequest.find(query)
      .sort({ preferredStartDate: 1 })
      .lean();

    const activeTours = tours.filter((t) => ["allocated", "proforma_issued", "active_tour"].includes(t.status));
    const completedTours = tours.filter((t) => ["completed", "reconciling"].includes(t.status));
    const upcomingTours = tours.filter((t) => ["confirmed", "allocated"].includes(t.status));

    return NextResponse.json({
      success: true,
      crewMember,
      allCrew,
      selectedIdentifier: identifier,
      tours,
      stats: {
        total: tours.length,
        active: activeTours.length,
        completed: completedTours.length,
        upcoming: upcomingTours.length,
      },
    });
  } catch (error: any) {
    console.error("Driver tours API error:", error);
    return NextResponse.json({ error: error?.message || "Failed to load driver tours" }, { status: 500 });
  }
}

