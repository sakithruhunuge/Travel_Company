import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

// POST /api/admin/rates/currency - Update currency settings and exchange rates
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      baseCurrency = "USD",
      targetCurrency = "LKR",
      liveRate,
      peggedRate,
      usePegged = false,
      forexBufferPercent = 2.5,
      source = "Manual",
    } = body;

    if (!baseCurrency || !targetCurrency) {
      return NextResponse.json({ error: "baseCurrency and targetCurrency required" }, { status: 400 });
    }

    await dbConnect();
    const tenantId = await resolveTenantId(sessionUser);
    const db = tenantScope(tenantId || "");

    const payload = {
      baseCurrency,
      targetCurrency,
      ...(liveRate !== undefined && { liveRate: Number(liveRate) }),
      ...(peggedRate !== undefined && { peggedRate: Number(peggedRate) }),
      usePegged: Boolean(usePegged),
      forexBufferPercent: Number(forexBufferPercent) || 2.5,
      source,
      lastScrapedAt: new Date(),
      updatedBy: sessionUser.id,
    };

    const result = await db.CurrencyExchange.findOneAndUpdate(
      { baseCurrency, targetCurrency },
      payload,
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error updating currency exchange:", error);
    return NextResponse.json({ error: error.message || "Failed to update currency" }, { status: 500 });
  }
}
