import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import QuotationDocument from "@/components/pdf/QuotationDocument";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import Tenant from "@/models/Tenant";

export const runtime = "nodejs";

// POST /api/quotations/generate
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    const userRole = sessionUser?.role;
    const isAuthorized =
      userRole === "tenant_admin" ||
      userRole === "marketing_officer" ||
      userRole === "travel_agent" ||
      userRole === "super_admin";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Access Denied: Marketing Officer or Agent role required" },
        { status: 403 }
      );
    }

    const tenantId = await resolveTenantId(sessionUser);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context not found" }, { status: 400 });
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      numberOfTravelers = 2,
      packageName = "Tailor-Made Tour Package",
      preferredStartDate,
      duration = "7 Days / 6 Nights",
      destinations = "",
      hotelTier = "4-Star Premium",
      transportMode = "Private Air-Conditioned Van",
      lineItems = [],
      markupPercent = 10,
      notes = "",
      saveAsLead = true,
      downloadPdf = false,
    } = body;

    if (!customerName || !customerEmail || !preferredStartDate) {
      return NextResponse.json(
        { error: "Customer name, email, and preferred start date are required" },
        { status: 400 }
      );
    }

    // 1. Calculate totals
    let subtotal = 0;
    const formattedLineItems = lineItems.length > 0
      ? lineItems.map((item: any) => {
          const qty = Number(item.quantity) || 1;
          const unitPrice = Number(item.unitPrice) || 0;
          const total = qty * unitPrice;
          subtotal += total;
          return {
            title: item.title,
            description: item.description || "",
            quantity: qty,
            unitPrice,
            total,
          };
        })
      : [
          {
            title: `Private Vehicle & Chauffeur Transit (${duration})`,
            description: "Includes fuel, highway tolls, parking & driver allowance",
            quantity: 1,
            unitPrice: 650,
            total: 650,
          },
          {
            title: `Hotel Accommodations (${hotelTier})`,
            description: `Daily breakfast included for ${numberOfTravelers} guests`,
            quantity: 6,
            unitPrice: 120,
            total: 720,
          },
          {
            title: "Cultural & Wildlife Excursion Passes",
            description: "Sigiriya Rock, Yala Safari Jeep, Kandy Temple of the Tooth",
            quantity: numberOfTravelers,
            unitPrice: 95,
            total: numberOfTravelers * 95,
          },
        ];

    if (lineItems.length === 0) {
      subtotal = 650 + 720 + (numberOfTravelers * 95);
    }

    const markupAmount = (subtotal * (Number(markupPercent) || 0)) / 100;
    const totalQuotation = subtotal + markupAmount;

    // Generate unique Quotation reference
    const now = new Date();
    const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const quotationNumber = `QTE-${datePrefix}-${randomSeq}`;
    const validUntilDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days validity

    // Fetch tenant branding
    const tenantDoc = await Tenant.findById(tenantId).lean() as any;
    const tenantName = tenantDoc?.name || "Travel Company";
    const primaryColor = tenantDoc?.branding?.primaryColor || "#0B7C8A";

    const quotationData = {
      quotationNumber,
      issueDate: now,
      validUntil: validUntilDate,
      lineItems: formattedLineItems,
      subtotal,
      markupPercent,
      totalAmount: totalQuotation,
      currency: "USD",
      notes,
      status: "sent" as const,
    };

    let savedRecord: any = null;
    if (saveAsLead) {
      // Find or create dummy user representation for offline tourist
      let guestUser: any = await db.User.findOne({ email: customerEmail });
      if (!guestUser) {
        guestUser = await db.User.create({
          name: customerName,
          email: customerEmail,
          role: "customer",
          provider: "credentials",
          status: "active",
        });
      }

      savedRecord = await db.TravelRequest.create({
        userId: guestUser._id,
        userName: customerName,
        userEmail: customerEmail,
        packageName,
        numberOfTravelers,
        preferredStartDate: new Date(preferredStartDate),
        specialRequests: `Destinations: ${destinations}. Hotel: ${hotelTier}. Transport: ${transportMode}. Notes: ${notes}`,
        submittedTotal: totalQuotation,
        source: userRole === "travel_agent" ? "travel_agent" : "marketing_officer",
        status: "quoted",
        quotation: quotationData,
        marketingOfficerId: sessionUser.id,
      });
    }

    // If direct PDF download requested
    if (downloadPdf) {
      const pdfBuffer = await renderToBuffer(
        React.createElement(QuotationDocument, {
          quotationNumber,
          tourId: savedRecord?.tourId,
          generatedDate: now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
          validUntilDate: validUntilDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
          tenantName,
          primaryColor,
          customerName,
          customerEmail,
          customerPhone,
          numberOfTravelers,
          packageName,
          preferredStartDate: new Date(preferredStartDate).toLocaleDateString(),
          duration,
          destinations,
          hotelTier,
          transportMode,
          lineItems: formattedLineItems,
          subtotal,
          totalPrice: totalQuotation,
          currency: "USD",
          notes,
          marketingOfficerName: sessionUser.name,
        } as any) as any
      );

      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="Quotation-${quotationNumber}.pdf"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      quotation: quotationData,
      bookingId: savedRecord?._id,
      message: "Formal quotation generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating quotation:", error);
    return NextResponse.json({ error: error?.message || "Failed to generate quotation" }, { status: 500 });
  }
}
