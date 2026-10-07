import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import "@/models/Payment";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = await resolveTenantId(sessionUser);
    
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    await dbConnect();
    const db = tenantScope(tenantId);

    // Aggregate Payment records to calculate total inbound and outbound for the specific month
    const summary = await db.Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$transactionType",
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    let totalInbound = 0;
    let totalOutbound = 0;

    summary.forEach((item) => {
      if (item._id === "inbound") totalInbound = item.totalAmount;
      if (item._id === "outbound") totalOutbound = item.totalAmount;
    });

    return NextResponse.json({
      success: true,
      month,
      year,
      totalInbound,
      totalOutbound,
      netCashflow: totalInbound - totalOutbound
    });
  } catch (error: any) {
    console.error("Fetch summary error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch summary" }, { status: 500 });
  }
}
