import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

// POST /api/admin/rates/attraction - Create or update an attraction tariff
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
      locationName,
      city,
      category = "Heritage",
      rates,
      isCustom = false,
      createdOnTheFlyForTourId,
      notes = "",
      isActive = true,
    } = body;

    if (!locationName || !city || !rates) {
      return NextResponse.json(
        { error: "locationName, city, and rates are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const tenantId = await resolveTenantId(sessionUser);
    const db = tenantScope(tenantId || "");

    const payload = {
      locationName: locationName.trim(),
      city: city.trim(),
      category,
      rates: {
        localLKR: Number(rates.localLKR) || 0,
        saarcLKR: Number(rates.saarcLKR) || 0,
        foreignLKR: Number(rates.foreignLKR) || 0,
        localUSD: rates.localUSD !== undefined ? Number(rates.localUSD) : undefined,
        saarcUSD: rates.saarcUSD !== undefined ? Number(rates.saarcUSD) : undefined,
        foreignUSD: rates.foreignUSD !== undefined ? Number(rates.foreignUSD) : undefined,
        childDiscountPercent: Number(rates.childDiscountPercent) || 50,
      },
      isCustom: Boolean(isCustom),
      createdOnTheFlyForTourId: createdOnTheFlyForTourId || undefined,
      notes,
      isActive: isActive !== false,
      lastVerifiedAt: new Date(),
    };

    let result;
    if (_id) {
      result = await db.AttractionRate.findOneAndUpdate({ _id }, payload, {
        new: true,
      });
    } else {
      result = await db.AttractionRate.create(payload);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error saving attraction rate:", error);
    return NextResponse.json({ error: error.message || "Failed to save attraction" }, { status: 500 });
  }
}

// DELETE /api/admin/rates/attraction - Soft-delete or remove an attraction
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
    }

    await dbConnect();
    const tenantId = await resolveTenantId(sessionUser);
    const db = tenantScope(tenantId || "");

    await db.AttractionRate.findOneAndUpdate({ _id: id }, { isActive: false });

    return NextResponse.json({ success: true, message: "Attraction deactivated" });
  } catch (error: any) {
    console.error("Error deactivating attraction:", error);
    return NextResponse.json({ error: error.message || "Failed to delete attraction" }, { status: 500 });
  }
}
