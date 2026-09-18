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
