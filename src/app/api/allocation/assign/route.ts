import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import { sendEmail } from "@/lib/emailService";
import { sendDriverDispatchSMS, sendSMS } from "@/lib/smsService";

export const runtime = "nodejs";

// POST /api/allocation/assign
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
      driver,
      tourGuide,
      assignedVehicle,
      agencyNotes,
      notifyCrew = true,
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    const booking = await db.TravelRequest.findOne({ _id: bookingId });
    if (!booking) {
      return NextResponse.json({ error: "Tour booking not found" }, { status: 404 });
    }

    // Apply allocation
    if (driver) booking.driver = driver;
    if (tourGuide) booking.tourGuide = tourGuide;
    if (assignedVehicle) booking.assignedVehicle = assignedVehicle;
    if (agencyNotes) booking.agencyNotes = agencyNotes;

    // AUTOMATED FLEET & DRIVER COSTING: Calculate instantly based on stored master packages
    try {
      const vehicleCategory = assignedVehicle?.category || "Minivan";
      const vehiclePackage =
        (await db.VehiclePricingPackage.findOne({ vehicleCategory, isActive: true })) ||
        (await db.VehiclePricingPackage.findOne({ isActive: true }));

      const currencyConfig =
        (await db.CurrencyExchange.findOne({ baseCurrency: "USD", targetCurrency: "LKR" })) || {
          liveRate: 304.85,
          peggedRate: 305.0,
          usePegged: false,
          forexBufferPercent: 2.5,
        };

      const durationDays = Number(booking.pricingInputs?.duration) || 5;
      const estimatedKm =
        Number(booking.pricingInputs?.totalRouteKm) || durationDays * 140; // Default ~140 km/day

      if (vehiclePackage) {
        const includedKm = durationDays * vehiclePackage.includedKmPerDay;
        const excessKm = Math.max(0, estimatedKm - includedKm);
        const baseVehicleCostLKR = durationDays * vehiclePackage.dailyRateLKR;
        const excessKmCostLKR = excessKm * vehiclePackage.excessRatePerKmLKR;
        const totalVehicleCostLKR = baseVehicleCostLKR + excessKmCostLKR;

        const driverBataLKR = durationDays * (vehiclePackage.driverDailyBataLKR || 4000);

        // Effective Forex multiplier with buffer protection
        const rawRate = currencyConfig.usePegged
          ? currencyConfig.peggedRate
          : currencyConfig.liveRate || 304.85;
        const bufferMultiplier = 1 - (currencyConfig.forexBufferPercent || 2.5) / 100;
        const protectedExchangeRate = rawRate * bufferMultiplier;

        const vehicleChargesUSD = Math.round(totalVehicleCostLKR / protectedExchangeRate);
        const driverChargesUSD = Math.round(driverBataLKR / protectedExchangeRate);

        // Auto-populate or update Proforma financial ledger
        if (!booking.proforma) {
          booking.proforma = {
            invoiceNumber: `PRF-${Date.now().toString().slice(-6)}`,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            hotelCharges: 0,
            vehicleCharges: vehicleChargesUSD,
            driverGuideCharges: driverChargesUSD,
            excursionCharges: 0,
            exchangeRate: rawRate,
            forexBufferPercent: currencyConfig.forexBufferPercent || 2.5,
            subtotal: vehicleChargesUSD + driverChargesUSD,
            totalAmount: vehicleChargesUSD + driverChargesUSD,
            advanceDepositDue: Math.round((vehicleChargesUSD + driverChargesUSD) * 0.3),
            advancePaid: 0,
            status: "issued",
          };
        } else {
          booking.proforma.vehicleCharges = vehicleChargesUSD;
          booking.proforma.driverGuideCharges = driverChargesUSD;
          booking.proforma.exchangeRate = rawRate;
          booking.proforma.forexBufferPercent = currencyConfig.forexBufferPercent || 2.5;

          const updatedSubtotal =
            (booking.proforma.hotelCharges || 0) +
            vehicleChargesUSD +
            driverChargesUSD +
            (booking.proforma.excursionCharges || 0);

          booking.proforma.subtotal = updatedSubtotal;
          booking.proforma.totalAmount = updatedSubtotal;
        }

        // Save detailed cost audit in pricingInputs
        booking.pricingInputs = {
          ...(booking.pricingInputs || {}),
          autoCalculatedFleetCost: {
            durationDays,
            estimatedKm,
            includedKm,
            excessKm,
            baseVehicleCostLKR,
            excessKmCostLKR,
            totalVehicleCostLKR,
            driverBataLKR,
            totalFleetCostLKR: totalVehicleCostLKR + driverBataLKR,
            vehicleChargesUSD,
            driverChargesUSD,
            appliedExchangeRate: rawRate,
            appliedBufferPercent: currencyConfig.forexBufferPercent || 2.5,
            calculatedAt: new Date(),
          },
        };
      }
    } catch (costErr) {
      console.warn("Auto fleet costing calculation warning:", costErr);
    }

    // Advance status to "allocated" if currently confirmed or pending
    if (["pending", "quoted", "confirmed"].includes(booking.status)) {
      booking.status = "allocated";
    }

    await booking.save();

    // Crew dispatch notifications
    if (notifyCrew) {
      const tourRef = booking.tourId || booking._id.toString();
      const startDate = new Date(booking.preferredStartDate).toLocaleDateString();

      // Dispatch to Driver
      if (driver?.email) {
        try {
          await sendEmail({
            to: driver.email,
            subject: `[Dispatch Notice] New Tour Assigned: ${booking.packageName} (ID: ${tourRef})`,
            html: `
              <h2>Tour Assignment Notification</h2>
              <p>Dear ${driver.name},</p>
              <p>You have been officially assigned as the chauffeur / driver for an upcoming tour.</p>
              <ul>
                <li><strong>Tour ID:</strong> ${tourRef}</li>
                <li><strong>Package:</strong> ${booking.packageName}</li>
                <li><strong>Start Date:</strong> ${startDate}</li>
                <li><strong>Guest Name:</strong> ${booking.userName}</li>
                <li><strong>Party Size:</strong> ${booking.numberOfTravelers} Travelers</li>
                ${assignedVehicle?.plateNumber ? `<li><strong>Assigned Vehicle:</strong> ${assignedVehicle.model} (${assignedVehicle.plateNumber})</li>` : ""}
              </ul>
              <p>Please log in to your mobile driver portal or contact the operations desk for your detailed pickup manifest.</p>
            `,
          });
        } catch (mailErr) {
          console.warn("Failed to email driver dispatch notice:", mailErr);
        }
      }

      if (driver?.phone) {
        try {
          await sendDriverDispatchSMS({
            to: driver.phone,
            driverName: driver.name,
            tourId: tourRef,
            packageName: booking.packageName,
            startDate,
            customerName: booking.userName,
          });
        } catch (smsErr) {
          console.warn("Failed to send driver dispatch SMS:", smsErr);
        }
      }

      // Dispatch to Guide
      if (tourGuide?.email && tourGuide.email !== driver?.email) {
        try {
          await sendEmail({
            to: tourGuide.email,
            subject: `[Dispatch Notice] New Tour Assigned: ${booking.packageName} (ID: ${tourRef})`,
            html: `
              <h2>Tour Assignment Notification</h2>
              <p>Dear ${tourGuide.name},</p>
              <p>You have been officially assigned as the Tour Guide for an upcoming tour.</p>
              <ul>
                <li><strong>Tour ID:</strong> ${tourRef}</li>
                <li><strong>Package:</strong> ${booking.packageName}</li>
                <li><strong>Start Date:</strong> ${startDate}</li>
                <li><strong>Guest Name:</strong> ${booking.userName}</li>
                <li><strong>Party Size:</strong> ${booking.numberOfTravelers} Travelers</li>
              </ul>
            `,
          });
        } catch (mailErr) {
          console.warn("Failed to email guide dispatch notice:", mailErr);
        }
      }

      if (tourGuide?.phone) {
        try {
          await sendSMS({
            to: tourGuide.phone,
            body: `Hello ${tourGuide.name}, you are assigned as Tour Guide for Tour ${tourRef} (${booking.packageName}) on ${startDate}. Guest: ${booking.userName} (${booking.numberOfTravelers} Pax).`,
          });
        } catch (smsErr) {
          console.warn("Failed to send guide dispatch SMS:", smsErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: booking.status,
      message: "Driver, guide, and vehicle successfully allocated",
      booking,
    });
  } catch (error: any) {
    console.error("Allocation assignment error:", error);
    return NextResponse.json({ error: error?.message || "Failed to allocate resources" }, { status: 500 });
  }
}
