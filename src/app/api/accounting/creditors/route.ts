import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import "@/models/Vendor";
import "@/models/Payable";

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

    // Ensure Vendor model is registered for population
    require("@/models/Vendor");

    // Fetch Payable records where there is an outstanding balance
    const creditors = await db.Payable.find({ balanceDue: { $gt: 0 } })
      .populate("vendorId")
      .sort({ dueDate: 1 })
      .lean();

    return NextResponse.json({ success: true, creditors });
  } catch (error: any) {
    console.error("Fetch creditors error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch creditors" }, { status: 500 });
  }
}
