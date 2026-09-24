/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import TravelRequest from "@/models/TravelRequest";
import DriverGuide from "@/models/DriverGuide";
import Package from "@/models/Package";
import { buildDriverRoutePlan } from "@/lib/distanceMatrix";
import { parseSpecifications } from "@/lib/pricingParser";

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

    const rawTours = await TravelRequest.find(query)
      .sort({ preferredStartDate: 1 })
      .lean();

    // Package lookups for tours booked from curated packages
    const packageIdsToFetch = rawTours
      .filter((t: any) => !t.pricingInputs?.destinations && t.packageId)
      .map((t: any) => t.packageId);

    const packageMap: Record<string, string[]> = {};
    if (packageIdsToFetch.length > 0) {
      try {
        const pkgs = await Package.find({
          $or: [
            { _id: { $in: packageIdsToFetch.filter((id: string) => /^[0-9a-fA-F]{24}$/.test(id)) } },
            { slug: { $in: packageIdsToFetch } },
          ],
        }).lean() as any[];

        pkgs.forEach((p: any) => {
          if (p.destinations && p.destinations.length > 0) {
            packageMap[p._id.toString()] = p.destinations;
            packageMap[p.slug] = p.destinations;
          }
        });
      } catch (pkgErr) {
        console.warn("[DriverTours] Failed to fetch package destinations:", pkgErr);
      }
    }

    // Enrich each tour with resolved destinations and precomputed routePlan
    const tours = rawTours.map((tour: any) => {
      let destinations: string[] = [];

      // 1. Direct pricingInputs destinations (from customizer / pricing calculator)
      if (Array.isArray(tour.pricingInputs?.destinations) && tour.pricingInputs.destinations.length > 0) {
        destinations = tour.pricingInputs.destinations;
      }

      // 2. Package destinations
      if (destinations.length === 0 && tour.packageId && packageMap[tour.packageId]) {
        destinations = packageMap[tour.packageId];
      }

      // 3. Parse from specialRequests specifications markdown
      if (destinations.length === 0 && tour.specialRequests) {
        const specs = parseSpecifications(tour.specialRequests);
        if (specs.destinations) {
          if (Array.isArray(specs.destinations)) {
            destinations = specs.destinations;
          } else if (typeof specs.destinations === "string") {
            destinations = specs.destinations
              .split(/[,;\n\r|]+/)
              .map((s: string) => s.trim())
              .filter(Boolean);
          }
        }
      }

      // 4. Default fallback: derive from package name or sensible defaults
      if (destinations.length === 0) {
        const lowerName = (tour.packageName || "").toLowerCase();
        const candidatePlaces = [
          "Colombo", "Negombo", "Kandy", "Sigiriya", "Dambulla",
          "Nuwara Eliya", "Ella", "Galle", "Bentota", "Mirissa",
          "Yala", "Udawalawe", "Anuradhapura", "Trincomalee"
        ];
        const matched = candidatePlaces.filter((p) => lowerName.includes(p.toLowerCase()));
        if (matched.length >= 2) {
          destinations = matched;
        } else {
          destinations = ["Colombo", "Kandy"];
        }
      }

      const routePlan = buildDriverRoutePlan(destinations, destinations[0] || "Colombo");

      return {
        ...tour,
        destinations,
        routePlan,
      };
    });

    const activeTours = tours.filter((t) =>
      ["allocated", "proforma_issued", "active_tour", "approved", "confirmed"].includes(t.status)
    );
    const completedTours = tours.filter((t) => ["completed", "reconciling"].includes(t.status));
    const upcomingTours = tours.filter((t) => ["confirmed", "allocated", "approved"].includes(t.status));

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


