import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

// POST /api/intour/expense-log
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
    const {
      bookingId,
      category = "ticket",
      description,
      amount,
      currency = "USD",
      receiptUrl,
      guestApproved = true,
      reportedBy = "marketing_officer",
    } = body;

    if (!bookingId || !description || amount === undefined) {
      return NextResponse.json(
        { error: "bookingId, description, and amount are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    const booking = await db.TravelRequest.findOne({ _id: bookingId });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const expenseItem = {
      reportedBy,
      reporterName: sessionUser.name || "Operations Team",
      category,
      description,
      amount: Number(amount) || 0,
      currency,
      receiptUrl,
      guestApproved: Boolean(guestApproved),
      createdAt: new Date(),
    };

    if (!booking.inTourExpenses) {
      booking.inTourExpenses = [];
    }
    booking.inTourExpenses.push(expenseItem as any);

    // If currently allocated or proforma_issued, mark as active_tour
    if (["allocated", "proforma_issued", "confirmed"].includes(booking.status)) {
      booking.status = "active_tour";
    }

    await booking.save();

    const totalAdditions = booking.inTourExpenses.reduce(
      (sum: number, exp: any) => sum + (exp.amount || 0),
      0
    );

    return NextResponse.json({
      success: true,
      inTourExpenses: booking.inTourExpenses,
      totalAdditions,
      status: booking.status,
      message: `In-tour addition of $${expenseItem.amount} recorded successfully`,
    });
  } catch (error: any) {
    console.error("In-tour expense logging error:", error);
    return NextResponse.json({ error: error?.message || "Failed to log expense" }, { status: 500 });
  }
}
