import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { parseSpecifications } from "@/lib/pricingParser";
import { parseRequestPricing } from "@/lib/pricingParser";
import TravelRequest from "@/models/TravelRequest";
import Tenant from "@/models/Tenant";
import Package from "@/models/Package";
import TripBriefDocument from "@/components/pdf/TripBriefDocument";
import { sendTripBriefEmail } from "@/lib/emailService";
import { buildDriverRoutePlan } from "@/lib/distanceMatrix";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";

export const runtime = "nodejs";

// POST /api/travel-requests/[id]/send-trip-brief
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const userRole = sessionUser.role;
    const isAdmin = userRole === "tenant_admin" || userRole === "super_admin" || userRole === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied: Admin role required" }, { status: 403 });
    }

    let body: {
      recipientEmail: string;
      recipientName: string;
      role: "Tour Guide" | "Car Driver";
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { recipientEmail, recipientName, role } = body;

    if (!recipientEmail || !recipientName || !role) {
      return NextResponse.json({ error: "recipientEmail, recipientName, and role are required" }, { status: 400 });
    }

    if (!["Tour Guide", "Car Driver"].includes(role)) {
      return NextResponse.json({ error: "role must be 'Tour Guide' or 'Car Driver'" }, { status: 400 });
    }

    await dbConnect();

    const bookingDoc = await TravelRequest.findById(params.id).lean() as any;
    if (!bookingDoc) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Fetch tenant branding
    const tenant = await Tenant.findById(bookingDoc.tenantId || sessionUser.tenantId).lean() as any;
    const tenantName = tenant?.name || "Travel Agency";
    const primaryColor = tenant?.branding?.primaryColor || "#0B7C8A";
    const secondaryColor = tenant?.branding?.secondaryColor || "#041A16";

    // Parse specs from the booking's specialRequests field
    const specs = parseSpecifications(bookingDoc.specialRequests || "");
    const { metrics } = parseRequestPricing(bookingDoc.specialRequests || "");

    const generatedDate = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const preferredDateStr = new Date(bookingDoc.preferredStartDate).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Extract customer special requests (traveler notes section only)
    let customerSpecialRequests = bookingDoc.specialRequests || "";
    if (customerSpecialRequests.includes("### 📝 Traveler Special Requests")) {
      customerSpecialRequests = customerSpecialRequests.split("### 📝 Traveler Special Requests")[1].trim();
    } else if (customerSpecialRequests.includes("### 🌟 Custom Calculator Specifications")) {
      // For custom calc bookings, take the header section only
      customerSpecialRequests = customerSpecialRequests.split("### 💵 Invoice Cost Breakdown")[0]
        .replace("### 🌟 Custom Calculator Specifications", "")
        .trim();
    }

    // Extract destinations for the driver route plan
    let rawDestinations: string[] | string = specs.destinations || "";

    if (!rawDestinations && bookingDoc.pricingInputs?.destinations) {
      rawDestinations = bookingDoc.pricingInputs.destinations;
    }

    if ((!rawDestinations || (Array.isArray(rawDestinations) && rawDestinations.length === 0)) && bookingDoc.packageId) {
      try {
        let pkg = await Package.findById(bookingDoc.packageId).lean() as any;
        if (!pkg) {
          pkg = await Package.findOne({ slug: bookingDoc.packageId }).lean() as any;
        }
        if (pkg?.destinations && pkg.destinations.length > 0) {
          rawDestinations = pkg.destinations;
        }
      } catch (err) {
        console.warn("[TripBrief] Could not fetch package destinations:", err);
      }
    }

    // If still no destination, check package name or special requests text
    if (!rawDestinations || (Array.isArray(rawDestinations) && rawDestinations.length === 0)) {
      rawDestinations = bookingDoc.packageName || "";
    }

    // Build the ordered driver route plan with actual predicted distances
    const routePlan = buildDriverRoutePlan(rawDestinations);

    // Format destinations string for display if not already set
    const formattedDestinations =
      specs.destinations ||
      (routePlan.destinationStops.length > 0 ? routePlan.destinationStops.join(", ") : undefined);

    // Generate the trip brief PDF with route plan
    const pdfElement = React.createElement(TripBriefDocument, {
      bookingId: bookingDoc._id.toString(),
      generatedDate,
      tenantName,
      primaryColor,
      secondaryColor,
      recipientName,
      recipientRole: role,
      customerName: bookingDoc.userName,
      customerEmail: bookingDoc.userEmail,
      numberOfTravelers: bookingDoc.numberOfTravelers,
      packageName: bookingDoc.packageName,
      preferredStartDate: preferredDateStr,
      destinations: formattedDestinations,
      duration: specs.duration || undefined,
      hotelTier: specs.hotelTier || undefined,
      transportMode: specs.transportMode || undefined,
      excursions: specs.excursions || undefined,
      addOns: specs.addOns || undefined,
      specialRequests: customerSpecialRequests || undefined,
      agencyNotes: bookingDoc.agencyNotes || undefined,
      totalPrice: metrics.totalPrice > 0 ? metrics.totalPrice : undefined,
      routePlan,
    });

    console.log(`[TripBrief] Generating PDF for booking ${params.id} (${role}) with ${routePlan.destinationStops.length} stops (${routePlan.totalDistanceKm} km)...`);
    const pdfBuffer = await renderToBuffer(pdfElement as any);

    console.log(`[TripBrief] Sending trip brief email to ${recipientEmail}...`);
    await sendTripBriefEmail(
      recipientEmail,
      recipientName,
      role,
      bookingDoc._id.toString(),
      bookingDoc.userName,
      bookingDoc.packageName,
      preferredDateStr,
      pdfBuffer,
      routePlan
    );

    return NextResponse.json({
      success: true,
      message: `Trip brief sent to ${recipientEmail}`,
      route: {
        destinations: routePlan.destinationStops,
        totalDistanceKm: routePlan.totalDistanceKm,
        totalDriveTime: routePlan.totalDriveTimeFormatted,
        legsCount: routePlan.segments.length,
      },
    });
  } catch (error) {
    console.error("[TripBrief] Failed to generate or send trip brief:", error);
    return NextResponse.json({ error: "Failed to generate and send trip brief" }, { status: 500 });
  }
}
