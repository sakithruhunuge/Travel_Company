import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

// POST /api/accounting/payables/manual
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = await resolveTenantId(sessionUser);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context missing" }, { status: 400 });
    }

    const body = await request.json();
    const { vendorName, vendorType, description, amountTotal, dueDate } = body;

    // --- Validation ---
    if (!vendorName || !vendorType || !amountTotal) {
      return NextResponse.json(
        { error: "vendorName, vendorType and amountTotal are required" },
        { status: 400 }
      );
    }

    const amount = Number(amountTotal);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "amountTotal must be a positive number" }, { status: 400 });
    }

    const allowedTypes = ["hotel", "transport", "attraction", "other"];
    if (!allowedTypes.includes(vendorType)) {
      return NextResponse.json(
        { error: `vendorType must be one of: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    // 1. Find-or-create Vendor (scoped to tenant + name + type)
    let vendor = await db.Vendor.findOne({ name: vendorName, type: vendorType });
    if (!vendor) {
      vendor = (await db.Vendor.create({ name: vendorName, type: vendorType })) as any;
    }
    if (!vendor) {
      return NextResponse.json({ error: "Failed to resolve vendor" }, { status: 500 });
    }

    // 2. Create the Payable
    const payable = await db.Payable.create({
      vendorId: vendor._id,
      description: description || vendorName,
      amountTotal: amount,
      amountPaid: 0,
      balanceDue: amount,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: "pending",
    });

    return NextResponse.json({ success: true, payable }, { status: 201 });
  } catch (error: any) {
    console.error("[Manual Payable] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payable" },
      { status: 500 }
    );
  }
}
