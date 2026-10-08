import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

// GET /api/rates/public - Retrieve active public rates for pricing calculators and customizers
export async function GET(request: Request) {
  try {
    await dbConnect();
    const tenantId = await resolveTenantId();
    const db = tenantScope(tenantId || "");

    let [attractions, vehicles, currencies, seasons] = await Promise.all([
      db.AttractionRate.find({ isActive: true }).select(
        "locationName city category rates isCustom notes"
      ),
      db.VehiclePricingPackage.find({ isActive: true }).select(
        "vehicleCategory name includedKmPerDay dailyRateLKR dailyRateUSD excessRatePerKmLKR excessRatePerKmUSD driverDailyBataLKR maxPassengers"
      ),
      db.CurrencyExchange.find({}).select(
        "baseCurrency targetCurrency liveRate peggedRate usePegged forexBufferPercent"
      ),
      db.SeasonRateTier.find({ isActive: true }).select(
        "name seasonType startDate endDate multiplierPercent marketRegions"
      ),
    ]);

    // Fallback to global default if tenant has no custom rates
    if (attractions.length === 0) {
      const globalDb = tenantScope("");
      [attractions, vehicles, currencies, seasons] = await Promise.all([
        globalDb.AttractionRate.find({ isActive: true }).select(
          "locationName city category rates isCustom notes"
        ),
        globalDb.VehiclePricingPackage.find({ isActive: true }).select(
          "vehicleCategory name includedKmPerDay dailyRateLKR dailyRateUSD excessRatePerKmLKR excessRatePerKmUSD driverDailyBataLKR maxPassengers"
        ),
        globalDb.CurrencyExchange.find({}).select(
          "baseCurrency targetCurrency liveRate peggedRate usePegged forexBufferPercent"
        ),
        globalDb.SeasonRateTier.find({ isActive: true }).select(
          "name seasonType startDate endDate multiplierPercent marketRegions"
        ),
      ]);
    }

    return NextResponse.json({
      success: true,
      data: {
        attractions,
        vehicles,
        currencies,
        seasons,
      },
    });
  } catch (error: any) {
    console.error("Error fetching public rates:", error);
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}
