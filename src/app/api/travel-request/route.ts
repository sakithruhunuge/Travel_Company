import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope } from "@/lib/tenantContext";
import { calculateTripPricing } from "@/lib/pricingEngine";

export async function POST(request: Request) {
  try {
    // Check authentication status
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const userRole = sessionUser.role;
    const tenantId = sessionUser.tenantId;

    // SuperAdmins cannot submit standard customer requests
    if (userRole === "super_admin") {
      return NextResponse.json({ error: "Administrators cannot create travel requests" }, { status: 403 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    await dbConnect();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { packageId, packageName, numberOfTravelers, preferredStartDate, specialRequests, pricingInputs, submittedTotal } = body;

    // Input Validations
    if (!packageName || typeof packageName !== "string" || packageName.trim() === "") {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 });
    }
    if (numberOfTravelers === undefined || typeof numberOfTravelers !== "number" || numberOfTravelers <= 0) {
      return NextResponse.json({ error: "Number of travelers must be a number greater than 0" }, { status: 400 });
    }
    if (!preferredStartDate || isNaN(Date.parse(preferredStartDate))) {
      return NextResponse.json({ error: "A valid preferred start date is required" }, { status: 400 });
    }

    if (!sessionUser.id || !sessionUser.email || !sessionUser.name) {
      return NextResponse.json({ error: "Missing required user profile information in session" }, { status: 400 });
    }

    let finalSpecialRequests = specialRequests || "";

    // Server-Side Pricing Verification (Data Integrity Guard)
    if (pricingInputs && typeof submittedTotal === "number") {
      // Validate structure of pricingInputs
      const { duration, destinations, hotelClass, transportMode, season, activities, extraNights, addOns } = pricingInputs;

      const validAddons = ["breakfast", "dinner", "airport-transfer", "guide"];

      if (
        typeof duration !== "number" || duration <= 0 ||
        typeof extraNights !== "number" || extraNights < 0 ||
        !Array.isArray(destinations) ||
        !["budget", "standard", "luxury", "premium-boutique"].includes(hotelClass) ||
        !["self-drive", "private-driver", "first-class-train", "charter-flight"].includes(transportMode) ||
        !["off-peak", "shoulder", "peak"].includes(season) ||
        !Array.isArray(activities) ||
        !Array.isArray(addOns) ||
        !addOns.every((a: any) => typeof a === "string" && validAddons.includes(a))
      ) {
        return NextResponse.json({ error: "Invalid pricing inputs parameters" }, { status: 400 });
      }

      // Re-verify traveler count alignment
      if (pricingInputs.numberOfTravelers !== numberOfTravelers) {
        return NextResponse.json({ error: "Travelers count mismatch between booking details and pricing engine" }, { status: 400 });
      }

      // Run Server Pricing Engine
      const calculated = calculateTripPricing(pricingInputs);

      // Verify Total Price
      if (calculated.totalPrice !== submittedTotal) {
        return NextResponse.json({
          error: "Pricing verification failed: client total price does not match server-validated cost breakdown",
          details: `Client submitted: $${submittedTotal}, Server calculated: $${calculated.totalPrice}`
        }, { status: 400 });
      }

      const initialMetrics = {
        baseCost: calculated.baseCost,
        accommodationCost: calculated.accommodationCost,
        transportCost: calculated.transportCost,
        destinationSurcharges: calculated.destinationSurcharges,
        activityCost: calculated.activityCost,
        addOnsCost: calculated.addOnsCost,
        customCharges: 0,
        additionalTaxes: 0,
        subtotal: calculated.subtotal,
        discountRate: calculated.discountRate,
        discount: calculated.discount,
        taxes: calculated.taxes,
        totalPrice: calculated.totalPrice,
        paymentStatus: "UNPAID"
      };

      const jsonBlock = `\`\`\`json\n${JSON.stringify(initialMetrics, null, 2)}\n\`\`\``;

      // Format pricing and configurations in Markdown (Architecture Compliance - Zero DB Migrations)
      const formattedPricingMarkdown = `### 🌟 Custom Calculator Specifications
- **Duration**: ${duration} Days (+${extraNights} Extra Nights)
- **Selected Destinations**: ${destinations.join(", ") || "None"}
- **Hotel Tier**: ${hotelClass.toUpperCase()}
- **Transport Mode**: ${transportMode.replace("-", " ").toUpperCase()}
- **Travel Season**: ${season.toUpperCase()}
- **Custom Excursions**: ${activities.join(", ") || "None"}
- **Selected Add-ons**: ${addOns.map((a: string) => a.replace("-", " ").toUpperCase()).join(", ") || "None"}

### 💵 Invoice Cost Breakdown (Server Verified)
- **Base Cost**: $${calculated.baseCost.toLocaleString()}
- **Accommodation Surcharge**: $${calculated.accommodationCost.toLocaleString()}
- **Transportation Cost**: $${calculated.transportCost.toLocaleString()}
- **Destination Tickets & Entry Surcharges**: $${calculated.destinationSurcharges.toLocaleString()}
- **Selected Excursions Cost**: $${calculated.activityCost.toLocaleString()}
- **Custom Add-ons Cost**: $${calculated.addOnsCost.toLocaleString()}
- **Subtotal**: $${calculated.subtotal.toLocaleString()}
- **Group size discount**: -$${calculated.discount.toLocaleString()}
- **Local Taxes & Fees (12%)**: $${calculated.taxes.toLocaleString()}
- **Grand Total**: $${calculated.totalPrice.toLocaleString()} USD
- **Payment Status**: UNPAID

### 📦 Metadata Store
${jsonBlock}`;

      finalSpecialRequests = `${formattedPricingMarkdown}\n\n### 📝 Traveler Special Requests\n${specialRequests || "None"}`;
    }

    // Save customized travel request to MongoDB scoped to Tenant
    const db = tenantScope(tenantId);
    const newRequest = await db.TravelRequest.create({
      userId: sessionUser.id,
      userName: sessionUser.name,
      userEmail: sessionUser.email,
      packageId: packageId || undefined,
      packageName: packageName.trim(),
      numberOfTravelers,
      preferredStartDate: new Date(preferredStartDate),
      specialRequests: finalSpecialRequests,
      status: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Travel request submitted successfully",
        data: newRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Database or API route error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
