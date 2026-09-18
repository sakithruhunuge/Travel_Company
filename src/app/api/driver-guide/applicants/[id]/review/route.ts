import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import { sendEmail } from "@/lib/emailService";
import Tenant from "@/models/Tenant";

export const runtime = "nodejs";

// PATCH /api/driver-guide/applicants/[id]/review
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const userRole = sessionUser.role;

    const isAuthorized = ["tenant_admin", "marketing_officer", "travel_agent", "super_admin", "admin"].includes(userRole);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Access Denied: Marketing Officer or Admin privileges required to review crew applications." },
        { status: 403 }
      );
    }

    const tenantId = await resolveTenantId(sessionUser);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    const applicantId = params.id;
    if (!applicantId) {
      return NextResponse.json({ error: "Applicant ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { action, rejectionReason } = body; // action: "approve" | "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid review action. Must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    await dbConnect();
    const db = tenantScope(tenantId);
    const tenantDoc: any = await Tenant.findById(tenantId).lean();

    const crewDoc: any = await db.DriverGuide.findOne({ _id: applicantId });
    if (!crewDoc) {
      return NextResponse.json({ error: "Crew applicant profile not found" }, { status: 404 });
    }

    const reviewerId = sessionUser.id;
    const now = new Date();

    if (action === "approve") {
      crewDoc.approvalStatus = "approved";
      crewDoc.status = "available";
      crewDoc.reviewedBy = reviewerId;
      crewDoc.reviewedAt = now;
      crewDoc.rejectionReason = undefined;
      await crewDoc.save();

      // Activate corresponding User credentials if linked
      if (crewDoc.userId) {
        await db.User.updateOne(
          { _id: crewDoc.userId },
          { $set: { status: "active" } }
        );
      } else {
        // Find by email if userId wasn't directly referenced
        await db.User.updateOne(
          { email: crewDoc.email },
          { $set: { status: "active" } }
        );
      }

      // Resolve proper tenant host and login link
      const rawHost = request.headers.get("host") || "localhost:3000";
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      
      let tenantHost = rawHost;
      if (tenantDoc?.slug && !rawHost.toLowerCase().startsWith(tenantDoc.slug.toLowerCase() + ".")) {
        tenantHost = `${tenantDoc.slug}.${rawHost}`;
      }

      const loginUrl = `${protocol}://${tenantHost}/en/login?callbackUrl=/driver`;
      const brandName = tenantDoc?.name || "Travel Company";
      const roleName = crewDoc.role === "both" ? "Driver & Tour Guide" : crewDoc.role === "driver" ? "Chauffeur / Driver" : "Tour Guide";

      // Dispatch approval email
      let emailDispatched = false;
      try {
        await sendEmail({
          to: crewDoc.email,
          subject: `Congratulations! Your Partner Account is Approved - ${brandName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
                <h1 style="color: #0d9488; font-size: 22px; margin: 0 0 6px 0; font-weight: 800;">${brandName}</h1>
                <p style="color: #64748b; font-size: 13px; margin: 0;">Partner Network & Fleet Dispatch Operations</p>
              </div>

              <h2 style="color: #16a34a; font-size: 19px; margin-top: 0;">Congratulations, ${crewDoc.name}!</h2>
              <p style="font-size: 14px; color: #334155;">
                We are pleased to inform you that your application to join <strong>${brandName}</strong> as a freelance <strong>${roleName}</strong> has been officially <strong>approved</strong> by our operations and marketing management team.
              </p>

              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
                <p style="margin: 0; color: #15803d; font-weight: 700; font-size: 14px;">Your Account is Now Active</p>
                <p style="margin: 4px 0 0 0; color: #166534; font-size: 13px;">
                  You can now log in directly to your Crew Dashboard to view assigned tours, update your live availability, and submit trip expense receipts.
                </p>
              </div>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
                <p style="margin: 0 0 10px 0; font-weight: 700; color: #0f172a; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">Your Account Login Details:</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; width: 120px;"><strong>Login Email:</strong></td>
                    <td style="padding: 4px 0; color: #0f172a; font-family: monospace; font-weight: bold;">${crewDoc.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;"><strong>Password:</strong></td>
                    <td style="padding: 4px 0; color: #0f172a;"><em>(The password you set during registration)</em></td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;"><strong>License No:</strong></td>
                    <td style="padding: 4px 0; color: #0f172a;">${crewDoc.licenseNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;"><strong>Role:</strong></td>
                    <td style="padding: 4px 0; color: #0f172a;">${roleName}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 28px 0;">
                <a href="${loginUrl}" style="background-color: #0d9488; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.25);">
                  Log In to Your Dashboard
                </a>
              </div>

              <div style="background-color: #ffffff; border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 13px; color: #475569;">
                <p style="margin: 0 0 6px 0; font-weight: 600;">Next Steps to Start Receiving Tours:</p>
                <ol style="margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 4px;">Click the button above to log into your account.</li>
                  <li style="margin-bottom: 4px;">Set your status to <strong>"Available"</strong> so dispatchers can allocate bookings to you.</li>
                  <li style="margin-bottom: 4px;">Keep your smartphone ready for notifications regarding upcoming itineraries and customer pickups.</li>
                </ol>
              </div>

              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                Sent automatically by ${brandName} Operations & Marketing Desk.<br/>
                If the button above does not work, open this link in your browser:<br/>
                <a href="${loginUrl}" style="color: #0d9488; word-break: break-all;">${loginUrl}</a>
              </p>
            </div>
          `,
        });
        emailDispatched = true;
        console.log(`[Review] Approval email sent successfully to ${crewDoc.email}`);
      } catch (mailErr) {
        console.error("[Review] Approval email dispatch failed:", mailErr);
      }

      return NextResponse.json({
        success: true,
        message: `${crewDoc.name}'s application has been approved and an activation email with dashboard login instructions was sent to ${crewDoc.email}.`,
        emailSent: emailDispatched,
        crew: crewDoc,
      });
    } else {
      // Reject action
      crewDoc.approvalStatus = "rejected";
      crewDoc.rejectionReason = rejectionReason?.trim() || "Application did not meet current operational requirements or document verification failed.";
      crewDoc.reviewedBy = reviewerId;
      crewDoc.reviewedAt = now;
      await crewDoc.save();

      // Suspend or mark user
      if (crewDoc.userId) {
        await db.User.updateOne(
          { _id: crewDoc.userId },
          { $set: { status: "suspended" } }
        );
      } else {
        await db.User.updateOne(
          { email: crewDoc.email },
          { $set: { status: "suspended" } }
        );
      }

      // Send rejection / feedback email
      try {
        await sendEmail({
          to: crewDoc.email,
          subject: `Update regarding your Partner Application - ${tenantDoc?.name || "Travel Company"}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #475569;">Hello ${crewDoc.name},</h2>
              <p>Thank you for your interest in partnering with <strong>${tenantDoc?.name || "our company"}</strong>.</p>
              <p>After careful review of your application and credentials by our marketing and operations team, we regret to inform you that we are unable to accept your freelance partner application at this time.</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #94a3b8; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #475569; font-weight: bold;">Review Feedback:</p>
                <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">
                  ${crewDoc.rejectionReason}
                </p>
              </div>

              <p>If you believe this was in error or if your credentials have been updated, please contact our operations desk directly.</p>
              <p style="font-size: 13px; color: #94a3b8; margin-top: 30px;">Warm regards,<br/>The Marketing & Operations Management Team</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.warn("Rejection email notification error:", mailErr);
      }

      return NextResponse.json({
        success: true,
        message: `${crewDoc.name}'s application has been rejected.`,
        crew: crewDoc,
      });
    }
  } catch (error: any) {
    console.error("Applicant review error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error during applicant review" },
      { status: 500 }
    );
  }
}
