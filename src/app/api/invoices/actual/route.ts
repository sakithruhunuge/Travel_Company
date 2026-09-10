import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import ActualInvoiceDocument from "@/components/pdf/ActualInvoiceDocument";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import Tenant from "@/models/Tenant";
import { sendEmail } from "@/lib/emailService";

export const runtime = "nodejs";

// POST /api/invoices/actual
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
      deductionsTotal = 0,
      notes = "",
      downloadPdf = false,
      sendToCustomer = false,
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    const booking = await db.TravelRequest.findOne({ _id: bookingId });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const proformaBase = booking.proforma?.totalAmount || booking.submittedTotal || 1500;
    const additionsTotal = (booking.inTourExpenses || []).reduce(
      (sum: number, exp: any) => sum + (exp.amount || 0),
      0
    );
    const deductions = Number(deductionsTotal) || 0;
    const netFinalTotal = Math.round(proformaBase + additionsTotal - deductions);

    const advancePaid = booking.proforma?.advancePaid || booking.submittedTotal || 0;
    const balanceDue = Math.max(0, netFinalTotal - advancePaid);
    const refundDue = Math.max(0, advancePaid - netFinalTotal);

    const now = new Date();
    const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `ACT-${datePrefix}-${randomSeq}`;

    const actualInvoiceData = {
      invoiceNumber,
      issueDate: now,
      proformaBaseTotal: proformaBase,
      additionsTotal,
      deductionsTotal: deductions,
      netFinalTotal,
      advancePaid,
      balanceDue,
      refundDue,
      settlementStatus: balanceDue === 0 ? ("settled" as const) : ("unsettled" as const),
      notes,
    };

    booking.actualInvoice = actualInvoiceData;
    booking.status = "completed";
    await booking.save();

    // Tenant info
    const tenantDoc = await Tenant.findById(tenantId).lean() as any;
    const tenantName = tenantDoc?.name || "Travel Company";
    const primaryColor = tenantDoc?.branding?.primaryColor || "#0B7C8A";

    const pdfProps = {
      invoiceNumber,
      proformaInvoiceNumber: booking.proforma?.invoiceNumber,
      tourId: booking.tourId || booking._id.toString(),
      issueDate: now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      tenantName,
      primaryColor,
      customerName: booking.userName,
      customerEmail: booking.userEmail,
      numberOfTravelers: booking.numberOfTravelers,
      packageName: booking.packageName,
      preferredStartDate: new Date(booking.preferredStartDate).toLocaleDateString(),
      proformaBaseTotal: proformaBase,
      inTourAdditions: (booking.inTourExpenses || []).map((exp: any) => ({
        description: exp.description,
        category: exp.category,
        amount: exp.amount,
      })),
      additionsTotal,
      deductionsTotal: deductions,
      netFinalTotal,
      advancePaid,
      balanceDue,
      refundDue,
      settlementStatus: actualInvoiceData.settlementStatus,
      currency: "USD",
      notes,
    };

    if (downloadPdf) {
      const pdfBuffer = await renderToBuffer(React.createElement(ActualInvoiceDocument, pdfProps as any) as any);
      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="ActualInvoice-${invoiceNumber}.pdf"`,
        },
      });
    }

    if (sendToCustomer && booking.userEmail) {
      try {
        const pdfBuffer = await renderToBuffer(React.createElement(ActualInvoiceDocument, pdfProps as any) as any);
        await sendEmail({
          to: booking.userEmail,
          subject: `[Final Tax Invoice] Tour Completed: ${booking.tourId || booking.packageName}`,
          html: `
            <h2>Your Final Tour Actual Invoice & Reconciliation</h2>
            <p>Dear ${booking.userName},</p>
            <p>Thank you for traveling with us! Your tour has successfully concluded.</p>
            <p>Attached is your reconciled Actual Invoice <strong>#${invoiceNumber}</strong>.</p>
            <ul>
              <li><strong>Proforma Base:</strong> $${proformaBase.toFixed(2)}</li>
              <li><strong>Mid-Tour Additions:</strong> +$${additionsTotal.toFixed(2)}</li>
              ${deductions > 0 ? `<li><strong>Deductions:</strong> -$${deductions.toFixed(2)}</li>` : ""}
              <li><strong>Net Final Cost:</strong> $${netFinalTotal.toFixed(2)}</li>
              <li><strong>Advance Paid:</strong> -$${advancePaid.toFixed(2)}</li>
              <li><strong>${balanceDue > 0 ? "Balance Payable" : "Refund Due"}:</strong> $${balanceDue > 0 ? balanceDue.toFixed(2) : refundDue.toFixed(2)}</li>
            </ul>
          `,
          attachments: [
            {
              filename: `Actual-Invoice-${invoiceNumber}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      } catch (emailErr) {
        console.warn("Failed to email actual invoice:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      actualInvoice: actualInvoiceData,
      status: booking.status,
      message: `Actual Invoice ${invoiceNumber} generated. Reconciled final total: $${netFinalTotal}`,
    });
  } catch (error: any) {
    console.error("Actual invoice generation error:", error);
    return NextResponse.json({ error: error?.message || "Failed to generate actual invoice" }, { status: 500 });
  }
}
