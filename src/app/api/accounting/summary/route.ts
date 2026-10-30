import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import mongoose from "mongoose";
import Payment from "@/models/Payment";
import Payable from "@/models/Payable";
import TravelRequest from "@/models/TravelRequest";

export const runtime = "nodejs";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const now   = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);
    const year  = parseInt(searchParams.get("year")  || String(now.getFullYear()),  10);

    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0, 23, 59, 59, 999);

    await dbConnect();
    const db = tenantScope(tenantId);

    // Convert tenantId string to ObjectId once for direct-model aggregations
    const tenantOid = tenantId ? new mongoose.Types.ObjectId(tenantId) : null;
    const tenantMatch = tenantOid ? { tenantId: tenantOid } : {};

    // ── 1. Monthly Cash Inbound / Outbound (Payment ledger) ──────────────────
    const paymentSummary = await db.Payment.aggregate([
      { $match: { paymentDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$transactionType", totalAmount: { $sum: "$amount" } } },
    ]);

    let totalInbound  = 0;
    let totalOutbound = 0;
    (paymentSummary as any[]).forEach((item) => {
      if (item._id === "inbound")  totalInbound  = item.totalAmount;
      if (item._id === "outbound") totalOutbound = item.totalAmount;
    });

    // ── 2. Total Outstanding Credit — unsettled Debtor balances ──────────────
    // For each TravelRequest we compute the remaining amount owed:
    //   • If an actual invoice exists and is not settled → use actualInvoice.balanceDue
    //   • Else if a proforma exists → use (advanceDepositDue − advancePaid), floored at 0
    const [debtorResult] = await TravelRequest.aggregate([
      { $match: tenantMatch },
      {
        $project: {
          outstanding: {
            $add: [
              // Actual invoice balance
              {
                $cond: [
                  {
                    $and: [
                      { $gt: [{ $ifNull: ["$actualInvoice.balanceDue", 0] }, 0] },
                      { $ne: ["$actualInvoice.settlementStatus", "settled"] },
                    ],
                  },
                  "$actualInvoice.balanceDue",
                  0,
                ],
              },
              // Proforma advance still owed (only when no active actual invoice)
              {
                $cond: [
                  {
                    $and: [
                      { $not: { $gt: [{ $ifNull: ["$actualInvoice.balanceDue", 0] }, 0] } },
                      { $gt: [{ $ifNull: ["$proforma.advanceDepositDue", 0] }, 0] },
                    ],
                  },
                  {
                    $max: [
                      0,
                      {
                        $subtract: [
                          { $ifNull: ["$proforma.advanceDepositDue", 0] },
                          { $ifNull: ["$proforma.advancePaid", 0] },
                        ],
                      },
                    ],
                  },
                  0,
                ],
              },
            ],
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$outstanding" } } },
    ]);

    const totalOutstandingCredit: number = debtorResult?.total ?? 0;

    // ── 3. Total Pending Payables — unsettled Creditor balances ──────────────
    const [payableResult] = await Payable.aggregate([
      {
        $match: {
          ...tenantMatch,
          status: { $in: ["pending", "partially_paid"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$balanceDue" } } },
    ]);

    const totalPendingPayables: number = payableResult?.total ?? 0;

    return NextResponse.json({
      success: true,
      month,
      year,
      totalInbound,
      totalOutbound,
      netCashflow: totalInbound - totalOutbound,
      totalOutstandingCredit,  // what debtors still owe us
      totalPendingPayables,    // what we still owe creditors
    });
  } catch (error: any) {
    console.error("Fetch summary error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
