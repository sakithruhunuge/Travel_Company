import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { resolveTenant } from "@/lib/tenantResolver";
import { tenantScope } from "@/lib/tenantContext";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;

    // Strict access control: enforce session authentication
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Authentication required to view invoice details" },
        { status: 401 }
      );
    }

    await dbConnect();

    // 1. Resolve host and tenant context
    const hostname = headers().get("host") || "";
    const tenant = await resolveTenant({ hostname });

    if (tenant.isAdmin) {
      return NextResponse.json(
        { error: "Cannot view invoices on platform admin host" },
        { status: 400 }
      );
    }

    const db = tenantScope(tenant.id!);

    // 2. Fetch travel request by ID
    const requestDoc: any = await db.TravelRequest.findOne({ _id: params.id }).lean();
    if (!requestDoc) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 3. Authorization check: user must be the booking owner OR authorized staff
    const isOwner =
      (sessionUser.id && requestDoc.userId && sessionUser.id.toString() === requestDoc.userId.toString()) ||
      (sessionUser.email && requestDoc.userEmail && sessionUser.email.toLowerCase() === requestDoc.userEmail.toLowerCase());

    const isStaff = [
      "tenant_admin",
      "marketing_officer",
      "travel_agent",
      "driver",
      "tour_guide",
      "super_admin",
    ].includes(sessionUser.role);

    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { error: "Access Denied: You do not have permission to view this invoice" },
        { status: 403 }
      );
    }

    // 4. Return sanitized billing details & brand attributes
    return NextResponse.json({
      invoice: {
        _id: requestDoc._id,
        packageName: requestDoc.packageName,
        numberOfTravelers: requestDoc.numberOfTravelers,
        preferredStartDate: requestDoc.preferredStartDate,
        specialRequests: requestDoc.specialRequests,
        userName: requestDoc.userName,
        userEmail: requestDoc.userEmail,
        status: requestDoc.status,
        createdAt: requestDoc.createdAt,
      },
      tenant: {
        name: tenant.name,
        companyName: tenant.name,
        primaryColor: tenant.branding?.primaryColor || "#0b7c8a",
        secondaryColor: tenant.branding?.secondaryColor || "#FF8B50",
      },
    });
  } catch (error) {
    console.error("Invoice API error:", error);
    return NextResponse.json({ error: "Failed to load invoice details" }, { status: 500 });
  }
}
