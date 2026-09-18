import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { resolveTenantId } from "@/lib/tenantContext";
import { sendEmail } from "@/lib/emailService";
import Tenant from "@/models/Tenant";

export const runtime = "nodejs";

// POST /api/driver-guide/invite
export async function POST(request: Request) {
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
        { error: "Access Denied: Marketing Manager or Admin privileges required to send invitations." },
        { status: 403 }
      );
    }

    const tenantId = await resolveTenantId(sessionUser);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    const body = await request.json();
    const { candidateName, candidateEmail, role = "driver", customMessage } = body;

    if (!candidateEmail || typeof candidateEmail !== "string" || !candidateEmail.includes("@")) {
      return NextResponse.json({ error: "A valid candidate email address is required" }, { status: 400 });
    }

    await dbConnect();
    const tenantDoc: any = await Tenant.findById(tenantId).lean();
    const brandName = tenantDoc?.name || "Travel Company";

    // Determine registration link
    const origin = request.headers.get("origin") || request.headers.get("referer") || "http://localhost:3000";
    const urlObj = new URL(origin);
    const joinUrl = `${urlObj.origin}/en/join/crew`;

    const roleLabel = role === "both" ? "Driver & Tour Guide" : role === "tour_guide" ? "Tour Guide" : "Chauffeur / Driver";

    // Send invitation email
    await sendEmail({
      to: candidateEmail.toLowerCase().trim(),
      subject: `Invitation: Join the ${brandName} Partner Network as a ${roleLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0d9488; margin: 0 0 6px 0;">${brandName}</h2>
            <p style="color: #64748b; font-size: 14px; margin: 0;">Partner Network & Fleet Operations</p>
          </div>

          <h3 style="color: #0f172a; margin-top: 0;">Hello ${candidateName ? candidateName : "Partner"},</h3>
          <p>
            You have been invited by <strong>${sessionUser.name || "Operations Management"}</strong> at <strong>${brandName}</strong> to join our freelance partner network as an official <strong>${roleLabel}</strong>.
          </p>

          ${customMessage ? `
            <div style="background-color: #f1f5f9; padding: 14px; border-left: 4px solid #0d9488; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #334155;">
              "${customMessage}"
            </div>
          ` : ""}

          <p>
            As a partner, you will receive tour assignments, navigate customer itineraries, log trip expenses, and manage your availability directly from your smartphone.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${joinUrl}" style="background-color: #0d9488; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.2);">
              Complete Your Registration
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; pt: 16px;">
            Or copy and paste this link in your browser:<br/>
            <a href="${joinUrl}" style="color: #0d9488; word-break: break-all;">${joinUrl}</a>
          </p>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;">
            Sent by ${brandName} Management • Partner Invitation
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Direct invitation email successfully sent to ${candidateEmail}!`,
    });
  } catch (error: any) {
    console.error("Invite sending error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send invitation email" },
      { status: 500 }
    );
  }
}
