import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import { resolveTenant } from "@/lib/tenantResolver";
import { tenantScope } from "@/lib/tenantContext";
import { sendEmail } from "@/lib/emailService";
import Tenant from "@/models/Tenant";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await dbConnect();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      name,
      email,
      phone,
      role = "driver", // "driver" | "tour_guide" | "both"
      licenseNumber,
      languages = ["English"],
      vehicleDetails,
      password,
      notes = "",
      documents,
    } = body;

    // Field Validations
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }
    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      return NextResponse.json({ error: "Contact phone number is required" }, { status: 400 });
    }
    if (!["driver", "tour_guide", "both"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }
    if (!licenseNumber || typeof licenseNumber !== "string" || licenseNumber.trim() === "") {
      return NextResponse.json({ error: "Driver / Tour Guide License Number is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    if ((role === "driver" || role === "both") && !vehicleDetails?.plateNumber) {
      return NextResponse.json({ error: "Vehicle plate number is required for driver applications" }, { status: 400 });
    }

    const formattedEmail = email.toLowerCase().trim();

    // 1. Host/Tenant Resolution
    const hostname = request.headers.get("host") || "";
    const tenant = await resolveTenant({ hostname });

    if (tenant.isAdmin) {
      return NextResponse.json({ error: "Partner registration is not supported on the administration domain" }, { status: 400 });
    }

    if (tenant.status !== "active") {
      return NextResponse.json({ error: "Partner registration is temporarily unavailable" }, { status: 400 });
    }

    // Check tenant partnerRegistrationMode
    const tenantDoc: any = await Tenant.findById(tenant.id).lean();
    if (tenantDoc?.partnerRegistrationMode === "disabled") {
      return NextResponse.json(
        { error: "Freelance partner registration is currently closed for this company." },
        { status: 403 }
      );
    }

    // 2. Tenant Scoping
    const db = tenantScope(tenant.id!);

    // Check if user already exists
    const existingUser = await db.User.findOne({ email: formattedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in or use another email." },
        { status: 409 }
      );
    }

    // Check if driver/guide record already exists with email or license
    const existingCrew = await db.DriverGuide.findOne({
      $or: [{ email: formattedEmail }, { licenseNumber: licenseNumber.trim() }],
    });
    if (existingCrew) {
      return NextResponse.json(
        { error: "A crew profile with this email or license number is already registered." },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User record in "pending" status
    const userRole = role === "both" ? "driver" : role;
    const newUser: any = await db.User.create({
      name: name.trim(),
      email: formattedEmail,
      password: hashedPassword,
      role: userRole,
      status: "pending",
      provider: "credentials",
    });

    // Create DriverGuide record in "pending" approval status and "freelance" employment type
    const newCrew: any = await db.DriverGuide.create({
      userId: newUser._id,
      name: name.trim(),
      email: formattedEmail,
      phone: phone.trim(),
      role,
      licenseNumber: licenseNumber.trim(),
      languages: Array.isArray(languages) && languages.length > 0 ? languages : ["English"],
      vehicleDetails: (role === "driver" || role === "both") && vehicleDetails ? {
        category: vehicleDetails.category || "Van",
        plateNumber: vehicleDetails.plateNumber?.trim() || "",
        model: vehicleDetails.model?.trim() || "",
        capacity: Number(vehicleDetails.capacity) || 4,
      } : undefined,
      employmentType: "freelance",
      approvalStatus: "pending",
      status: "off_duty",
      rating: 5.0,
      activeToursCount: 0,
      notes: notes?.trim() || "Freelance application submitted online.",
      documents: documents || {},
    });

    // Send confirmation email to applicant
    try {
      await sendEmail({
        to: formattedEmail,
        subject: `Application Received: Welcome to ${tenantDoc?.name || "Travel Company"} Partner Network`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #2563eb;">Hello ${name},</h2>
            <p>Thank you for applying to join <strong>${tenantDoc?.name || "our team"}</strong> as a freelance <strong>${role === "both" ? "Driver & Tour Guide" : role === "driver" ? "Chauffeur / Driver" : "Tour Guide"}</strong>.</p>
            <p>Your application has been received and is currently under review by our operations and marketing management team.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Registration Details:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Role:</strong> ${role.toUpperCase()}</li>
                <li><strong>License No:</strong> ${licenseNumber}</li>
                <li><strong>Status:</strong> <span style="color: #d97706; font-weight: bold;">Pending Admin Approval</span></li>
              </ul>
            </div>
            <p>Once your credentials and documents are verified by our marketing officer, you will receive an approval notification and can log in immediately to accept tour assignments and manage your schedule.</p>
            <p style="font-size: 13px; color: #64748b; margin-top: 30px;">This is an automated notification from ${tenantDoc?.name || "Travel Company"}.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.warn("Failed to dispatch confirmation email:", mailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your freelance application was submitted successfully! Our marketing and operations team will review your application shortly.",
        applicantId: newCrew._id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Driver/Guide self-registration error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error during registration" },
      { status: 500 }
    );
  }
}
