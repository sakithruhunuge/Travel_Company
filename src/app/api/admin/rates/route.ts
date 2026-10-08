import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

// GET /api/admin/rates - Retrieve all master pricing data for the active tenant
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["tenant_admin", "super_admin", "marketing_officer", "travel_agent"];
    if (!allowedRoles.includes(sessionUser.role)) {
      return NextResponse.json({ error: "Forbidden: Staff role required" }, { status: 403 });
    }

    await dbConnect();
    const tenantId = await resolveTenantId(sessionUser);

    const db = tenantScope(tenantId || "");

    // Fetch tenant-scoped rates
    let [attractions, vehicles, currencies, seasons, hotels] = await Promise.all([
      db.AttractionRate.find({ isActive: true }).sort({ category: 1, locationName: 1 }),
      db.VehiclePricingPackage.find({ isActive: true }).sort({ maxPassengers: 1 }),
      db.CurrencyExchange.find({}),
      db.SeasonRateTier.find({ isActive: true }).sort({ startDate: 1 }),
      db.HotelContractRate.find({ isActive: true }).sort({ city: 1, hotelName: 1 }),
    ]);

    // Fallback: If this tenant has no data yet, fetch global baseline
    if (attractions.length === 0) {
      const globalDb = tenantScope("");
      [attractions, vehicles, currencies, seasons, hotels] = await Promise.all([
        globalDb.AttractionRate.find({ isActive: true }).sort({ category: 1, locationName: 1 }),
        globalDb.VehiclePricingPackage.find({ isActive: true }).sort({ maxPassengers: 1 }),
        globalDb.CurrencyExchange.find({}),
        globalDb.SeasonRateTier.find({ isActive: true }).sort({ startDate: 1 }),
        globalDb.HotelContractRate.find({ isActive: true }).sort({ city: 1, hotelName: 1 }),
      ]);
    }

    return NextResponse.json({
      success: true,
      data: {
        attractions,
        vehicles,
        currencies,
        seasons,
        hotels,
      },
    });
  } catch (error: any) {
    console.error("Error fetching master rates:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch rates" }, { status: 500 });
  }
}
