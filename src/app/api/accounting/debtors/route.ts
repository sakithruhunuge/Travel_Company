import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = await resolveTenantId(sessionUser);
    await dbConnect();
    const db = tenantScope(tenantId);

    // Fetch debtors: TravelRequests where either the Actual Invoice or Proforma has an outstanding balance
    const debtors = await db.TravelRequest.find({
      $or: [
        { "actualInvoice.balanceDue": { $gt: 0 } },
        { 
          "proforma.advanceDepositDue": { $gt: 0 },
          $expr: { $gt: ["$proforma.advanceDepositDue", "$proforma.advancePaid"] },
          "actualInvoice": { $exists: false }
        }
      ]
    }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, debtors });
  } catch (error: any) {
    console.error("Fetch debtors error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch debtors" }, { status: 500 });
  }
}
