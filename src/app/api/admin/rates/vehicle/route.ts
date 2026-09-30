import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

// POST /api/admin/rates/vehicle - Create or update vehicle pricing package
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
      vehicleCategory,
      name,
      includedKmPerDay = 100,
      dailyRateLKR = 0,
      dailyRateUSD = 0,
      excessRatePerKmLKR = 0,
      excessRatePerKmUSD = 0,
      driverDailyBataLKR = 4000,
      driverDailyBataUSD = 13,
      maxPassengers = 4,
      description = "",
      isActive = true,
    } = body;

    if (!vehicleCategory || !name) {
      return NextResponse.json(
        { error: "vehicleCategory and name are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const tenantId = await resolveTenantId(sessionUser);
    const db = tenantScope(tenantId || "");

    const payload = {
      vehicleCategory,
      name: name.trim(),
      includedKmPerDay: Number(includedKmPerDay),
      dailyRateLKR: Number(dailyRateLKR),
      dailyRateUSD: Number(dailyRateUSD),
      excessRatePerKmLKR: Number(excessRatePerKmLKR),
      excessRatePerKmUSD: Number(excessRatePerKmUSD),
      driverDailyBataLKR: Number(driverDailyBataLKR),
      driverDailyBataUSD: Number(driverDailyBataUSD),
      maxPassengers: Number(maxPassengers),
      description,
      isActive: isActive !== false,
    };

    let result;
    if (_id) {
      result = await db.VehiclePricingPackage.findOneAndUpdate({ _id }, payload, {
        new: true,
      });
    } else {
      result = await db.VehiclePricingPackage.create(payload);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error saving vehicle pricing package:", error);
    return NextResponse.json({ error: error.message || "Failed to save vehicle package" }, { status: 500 });
  }
}
