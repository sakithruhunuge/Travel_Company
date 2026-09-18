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
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    const userRole = sessionUser?.role;

    const isManagement = ["tenant_admin", "marketing_officer", "travel_agent", "super_admin", "admin"].includes(userRole);
    const isCrew = userRole === "driver" || userRole === "tour_guide";

    const { searchParams } = new URL(request.url);
    let identifier = searchParams.get("identifier")?.trim() || "";

    await dbConnect();

    // If driver or tour guide, FORCE identifier to their own identity
    if (isCrew && sessionUser) {
      identifier = sessionUser.email || sessionUser.name;
    } else if (!isManagement && !sessionUser) {
      // In development or if explicitly allowed, fallback to requested identifier or first available
      if (!identifier) {
        return NextResponse.json({ error: "Authentication required to access driver tours" }, { status: 401 });
      }
    }

    // Only allow management to see allCrew dropdown
    let allCrew: any[] = [];
    if (isManagement) {
      allCrew = await DriverGuide.find({ approvalStatus: "approved" }).sort({ name: 1 }).lean();
    }

    // Check user session if identifier not explicitly provided for management
    if (!identifier && isManagement) {
      if (allCrew.length > 0) {
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

    // If still no crewMember found but user is logged in, try user ID link
    if (!crewMember && sessionUser?.id) {
      crewMember = await DriverGuide.findOne({ userId: sessionUser.id }).lean();
      if (crewMember) {
        identifier = crewMember.name || crewMember.email;
      }
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
      allCrew: isManagement ? allCrew : [],
      selectedIdentifier: identifier,
      isManagement,
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

