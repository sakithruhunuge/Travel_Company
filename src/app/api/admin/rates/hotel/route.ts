import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

// POST /api/admin/rates/hotel - Create or update contracted hotel rate
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      _id,
      hotelName,
      city,
      roomCategory = "Standard",
      mealPlan = "BB",
      seasonType = "shoulder",
      validFrom,
      validTo,
      netRateLKR = 0,
      netRateUSD = 0,
      marketTiers = ["ALL"],
      fallbackScrapedRateUSD,
      notes = "",
      isActive = true,
    } = body;

    if (!hotelName || !city || !validFrom || !validTo) {
      return NextResponse.json(
        { error: "hotelName, city, validFrom, and validTo are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const tenantId = await resolveTenantId(sessionUser);
    const db = tenantScope(tenantId || "");

    const payload = {
      hotelName: hotelName.trim(),
      city: city.trim(),
      roomCategory,
      mealPlan,
      seasonType,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      netRateLKR: Number(netRateLKR) || 0,
      netRateUSD: Number(netRateUSD) || 0,
      marketTiers: Array.isArray(marketTiers) ? marketTiers : [marketTiers],
      fallbackScrapedRateUSD:
        fallbackScrapedRateUSD !== undefined ? Number(fallbackScrapedRateUSD) : undefined,
      notes,
      isActive: isActive !== false,
    };

    let result;
    if (_id) {
      result = await db.HotelContractRate.findOneAndUpdate({ _id }, payload, {
        new: true,
      });
    } else {
      result = await db.HotelContractRate.create(payload);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error saving hotel contract rate:", error);
    return NextResponse.json({ error: error.message || "Failed to save hotel rate" }, { status: 500 });
  }
}
