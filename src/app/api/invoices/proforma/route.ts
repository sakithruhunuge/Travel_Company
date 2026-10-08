import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import ProformaInvoiceDocument from "@/components/pdf/ProformaInvoiceDocument";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import Tenant from "@/models/Tenant";
import { sendEmail } from "@/lib/emailService";
import { sendGuestProformaSMS } from "@/lib/smsService";

export const runtime = "nodejs";

// POST /api/invoices/proforma
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
      hotelCharges = 750,
      vehicleCharges = 680,
      driverGuideCharges = 240,
      excursionCharges = 190,
      forexBufferPercent = 2.5,
      depositPercent = 30,
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

    const hCost = Number(hotelCharges) || 0;
    const vCost = Number(vehicleCharges) || 0;
    const dgCost = Number(driverGuideCharges) || 0;
    const eCost = Number(excursionCharges) || 0;
    const subtotal = hCost + vCost + dgCost + eCost;

    const fxPct = Number(forexBufferPercent) || 2.5;
    const fxBuffer = (subtotal * fxPct) / 100;
    const totalAmount = Math.round(subtotal + fxBuffer);

    const depPct = Number(depositPercent) || 30;
    const advanceDepositDue = Math.round((totalAmount * depPct) / 100);

    const now = new Date();
    const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `PRF-${datePrefix}-${randomSeq}`;
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const proformaData = {
      invoiceNumber,
      issueDate: now,
      dueDate,
      hotelCharges: hCost,
      vehicleCharges: vCost,
      driverGuideCharges: dgCost,
      excursionCharges: eCost,
      exchangeRate: 1,
      forexBufferPercent: fxPct,
      subtotal,
      totalAmount,
      advanceDepositDue,
      advancePaid: booking.proforma?.advancePaid || 0,
      status: "issued" as const,
    };

    booking.proforma = proformaData;
    booking.status = "proforma_issued";
    await booking.save();

    // Tenant info
    const tenantDoc = await Tenant.findById(tenantId).lean() as any;
    const tenantName = tenantDoc?.name || "Travel Company";
    const primaryColor = tenantDoc?.branding?.primaryColor || "#0B7C8A";

    const pdfProps = {
      invoiceNumber,
      tourId: booking.tourId || booking._id.toString(),
      issueDate: now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      dueDate: dueDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      tenantName,
      primaryColor,
      customerName: booking.userName,
      customerEmail: booking.userEmail,
      numberOfTravelers: booking.numberOfTravelers,
      packageName: booking.packageName,
      preferredStartDate: new Date(booking.preferredStartDate).toLocaleDateString(),
      assignedDriverName: booking.driver?.name,
      assignedGuideName: booking.tourGuide?.name,
      assignedVehiclePlate: booking.assignedVehicle?.plateNumber,
      hotelCharges: hCost,
      vehicleCharges: vCost,
      driverGuideCharges: dgCost,
      excursionCharges: eCost,
      forexBufferPercent: fxPct,
      subtotal,
      totalAmount,
      advanceDepositDue,
      advancePaid: proformaData.advancePaid,
      currency: "USD",
      paymentStatus: proformaData.advancePaid >= advanceDepositDue ? "PAID" : "DEPOSIT_PENDING",
    };

    if (downloadPdf) {
      const pdfBuffer = await renderToBuffer(React.createElement(ProformaInvoiceDocument, pdfProps as any) as any);
      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="Proforma-${invoiceNumber}.pdf"`,
        },
      });
    }

    if (sendToCustomer && booking.userEmail) {
      try {
        const pdfBuffer = await renderToBuffer(React.createElement(ProformaInvoiceDocument, pdfProps as any) as any);
        await sendEmail({
          to: booking.userEmail,
          subject: `[Proforma Invoice] Advance Deposit for Tour ${booking.tourId || booking.packageName}`,
          html: `
            <h2>Your Official Tour Proforma Invoice</h2>
            <p>Dear ${booking.userName},</p>
            <p>Thank you for confirming your tour. We have locked in your vehicle, driver, and hotel allocations.</p>
            <p>Please find your attached Proforma Invoice <strong>#${invoiceNumber}</strong> for the advance deposit of <strong>$${advanceDepositDue.toFixed(2)}</strong>.</p>
            <p>You can also review your itinerary and settle payment directly online through your trip portal.</p>
          `,
          attachments: [
            {
              filename: `Proforma-Invoice-${invoiceNumber}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      } catch (emailErr) {
        console.warn("Failed to email proforma invoice:", emailErr);
      }

      // Guest SMS alert
      const phoneMatch = (booking.specialRequests || "").match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) {
        try {
          await sendGuestProformaSMS({
            to: phoneMatch[0],
            guestName: booking.userName,
            tourId: booking.tourId || booking._id.toString(),
            depositAmount: advanceDepositDue,
          });
        } catch (smsErr) {
          console.warn("Failed to send guest proforma SMS:", smsErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      proforma: proformaData,
      tourId: booking.tourId,
      status: booking.status,
      message: "Proforma Invoice successfully generated",
    });
  } catch (error: any) {
    console.error("Proforma generation error:", error);
    return NextResponse.json({ error: error?.message || "Failed to generate proforma invoice" }, { status: 500 });
  }
}
