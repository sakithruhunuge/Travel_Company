import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { resolveTenantId } from "@/lib/tenantContext";
import Tenant from "@/models/Tenant";

export const runtime = "nodejs";

// GET /api/tenant/settings/partner-registration
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    const tenantId = await resolveTenantId(sessionUser);

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context missing" }, { status: 400 });
    }

    await dbConnect();
    const tenant: any = await Tenant.findById(tenantId).select("name slug partnerRegistrationMode").lean();

    return NextResponse.json({
      success: true,
      partnerRegistrationMode: tenant?.partnerRegistrationMode || "invite_only",
      tenantSlug: tenant?.slug || "ceylon",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/tenant/settings/partner-registration
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const userRole = sessionUser.role;

    const isAuthorized = ["tenant_admin", "marketing_officer", "super_admin", "admin"].includes(userRole);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Access Denied: Admin or Marketing Manager role required" }, { status: 403 });
    }

    const tenantId = await resolveTenantId(sessionUser);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context missing" }, { status: 400 });
    }

    const body = await request.json();
    const { partnerRegistrationMode } = body;

    if (!["public", "invite_only", "disabled"].includes(partnerRegistrationMode)) {
      return NextResponse.json({ error: "Invalid partner registration mode" }, { status: 400 });
    }

    await dbConnect();
    const updatedTenant: any = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: { partnerRegistrationMode } },
      { new: true }
    ).select("name slug partnerRegistrationMode");

    return NextResponse.json({
      success: true,
      partnerRegistrationMode: updatedTenant.partnerRegistrationMode,
      message: `Partner registration mode updated to ${partnerRegistrationMode}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
