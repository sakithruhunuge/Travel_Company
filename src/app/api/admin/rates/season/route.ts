import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

// POST /api/admin/rates/season - Create or update a season rate tier
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
      name,
      seasonType = "shoulder",
      startDate,
      endDate,
      multiplierPercent = 100,
      marketRegions = ["ALL"],
      description = "",
      isActive = true,
    } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "name, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const tenantId = await resolveTenantId(sessionUser);
    const db = tenantScope(tenantId || "");

    const payload = {
      name: name.trim(),
      seasonType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      multiplierPercent: Number(multiplierPercent) || 100,
      marketRegions: Array.isArray(marketRegions) ? marketRegions : [marketRegions],
      description,
      isActive: isActive !== false,
    };

    let result;
    if (_id) {
      result = await db.SeasonRateTier.findOneAndUpdate({ _id }, payload, {
        new: true,
      });
    } else {
      result = await db.SeasonRateTier.create(payload);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error saving season tier:", error);
    return NextResponse.json({ error: error.message || "Failed to save season tier" }, { status: 500 });
  }
}
