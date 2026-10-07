import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import "@/models/Payment";
import "@/models/Payable";
import "@/models/TravelRequest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = await resolveTenantId(sessionUser);
    const body = await request.json();
    const { referenceType, referenceId, amount, paymentMethod, notes, paymentDate, vendorId } = body;

    if (!referenceType || !referenceId || !amount || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    const transactionType = referenceType === "TravelRequest" ? "inbound" : "outbound";

    // 1. Create the immutable ledger record
    const payment = new db.Payment({
      transactionType,
      referenceType,
      referenceId,
      vendorId,
      amount: Number(amount),
      paymentMethod,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes,
      recordedBy: sessionUser.id,
    });
    
    await payment.save();

    // 2. Safely atomic update ($inc) the balances
    if (referenceType === "TravelRequest") {
      // Find the document first to determine if we are updating proforma or actual invoice
      const tr = await db.TravelRequest.findById(referenceId);
      if (!tr) throw new Error("TravelRequest not found");

      let updateQuery: any = {};
      let isActual = false;
      let isProforma = false;
      
      if (tr.actualInvoice && typeof tr.actualInvoice.balanceDue === "number" && tr.actualInvoice.balanceDue > 0) {
        updateQuery = {
          $inc: { 
            "actualInvoice.balanceDue": -Number(amount),
            "actualInvoice.advancePaid": Number(amount)
          }
        };
        isActual = true;
      } else if (tr.proforma && typeof tr.proforma.advanceDepositDue === "number" && tr.proforma.advanceDepositDue > tr.proforma.advancePaid) {
        updateQuery = {
          $inc: { 
            "proforma.advancePaid": Number(amount)
          }
        };
        isProforma = true;
      } else {
        // Fallback if none strictly match, just add to advancePaid of actualInvoice if it exists
         updateQuery = {
          $inc: { 
            "actualInvoice.advancePaid": Number(amount)
          }
        };
      }

      const updatedTr = await db.TravelRequest.findByIdAndUpdate(
        referenceId,
        updateQuery,
        { new: true }
      );

      // Check if settled and update status atomically to avoid concurrent save overwrites
      if (updatedTr) {
         if (isActual && updatedTr.actualInvoice && updatedTr.actualInvoice.balanceDue <= 0) {
            await db.TravelRequest.updateOne(
              { _id: referenceId, "actualInvoice.balanceDue": { $lte: 0 } },
              { $set: { "actualInvoice.settlementStatus": "settled" } }
            );
         } else if (isProforma && updatedTr.proforma && updatedTr.proforma.advancePaid >= updatedTr.proforma.advanceDepositDue) {
            await db.TravelRequest.updateOne(
              { _id: referenceId, "proforma.advancePaid": { $gte: updatedTr.proforma.advanceDepositDue } },
              { $set: { "proforma.status": "paid" } }
            );
         }
      }

    } else if (referenceType === "Payable") {
      const updatedPayable = await db.Payable.findByIdAndUpdate(
        referenceId,
        {
          $inc: {
            amountPaid: Number(amount),
            balanceDue: -Number(amount),
          }
        },
        { new: true }
      );

      // Check if settled and update status atomically
      if (updatedPayable && updatedPayable.balanceDue <= 0) {
        await db.Payable.updateOne(
          { _id: referenceId, balanceDue: { $lte: 0 } },
          { $set: { status: "settled" } }
        );
      }
    }

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error("Payment creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to process payment" }, { status: 500 });
  }
}
