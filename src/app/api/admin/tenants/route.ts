import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/authHelpers";
import { dbConnect } from "@/lib/mongodb";
import Tenant from "@/models/Tenant";
import User from "@/models/User";
import TravelRequest from "@/models/TravelRequest";
import { TenantProvisioningService } from "@/lib/services/TenantProvisioningService";

// GET /api/admin/tenants - Scoped SuperAdmin listing
export async function GET() {
  try {
    const { authorized, response } = await requireSuperAdmin();
    if (!authorized) return response!;

    await dbConnect();

    // 1. Fetch raw tenants (excluding soft-deleted/inactive if required, but list all for administration)
    const tenants = await Tenant.find({ status: { $ne: "inactive" } })
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch registry statistics metrics
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t: any) => t.status === "active").length;
    const suspendedTenants = tenants.filter((t: any) => t.status === "suspended").length;

    const planBreakdown = tenants.reduce((acc: any, t: any) => {
      const plan = t.plan || "free";
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});

    const totalRequests = await TravelRequest.countDocuments({});

    // 3. Resolve tenant metrics dynamically
    const enrichedTenants = await Promise.all(
      tenants.map(async (tenant: any) => {
        const [requestCount, customerCount] = await Promise.all([
          TravelRequest.countDocuments({ tenantId: tenant._id }),
          User.countDocuments({ tenantId: tenant._id, role: "customer" }),
        ]);

        return {
          id: tenant._id.toString(),
          name: tenant.name,
          slug: tenant.slug,
          customDomain: tenant.customDomain || null,
          plan: tenant.plan,
          status: tenant.status,
          branding: tenant.branding || {},
          createdAt: tenant.createdAt,
          requestCount,
          customerCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      tenants: enrichedTenants,
      stats: {
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalRequests,
        planBreakdown,
      },
    });
  } catch (error) {
    console.error("SuperAdmin list tenants failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/admin/tenants - Scoped SuperAdmin Tenant registration via Provisioning Service
export async function POST(request: Request) {
  try {
    const { authorized, response } = await requireSuperAdmin();
    if (!authorized) return response!;

    await dbConnect();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, slug, customDomain, plan, adminName, adminEmail, adminPassword } = body;

    // Direct Validation of payload fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Tenant name is required" }, { status: 400 });
    }
    if (!adminName || typeof adminName !== "string" || adminName.trim() === "") {
      return NextResponse.json({ error: "Administrator name is required" }, { status: 400 });
    }
    if (!adminEmail || typeof adminEmail !== "string" || !/^\S+@\S+\.\S+$/.test(adminEmail)) {
      return NextResponse.json({ error: "A valid administrator email is required" }, { status: 400 });
    }
    if (!adminPassword || typeof adminPassword !== "string" || adminPassword.length < 6) {
      return NextResponse.json({ error: "Administrator password must be at least 6 characters" }, { status: 400 });
    }

    // Auto-generate slug if not provided
    let tenantSlug = slug;
    if (!tenantSlug || typeof tenantSlug !== "string" || tenantSlug.trim() === "") {
      tenantSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Invoke Tenant Provisioning Service with rollback support
    const result = await TenantProvisioningService.provision({
      name: name.trim(),
      slug: tenantSlug,
      customDomain: customDomain || undefined,
      plan: plan || "free",
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim(),
      adminPassword,
    });

    return NextResponse.json(
      {
        success: true,
        tenant: result.tenant,
        admin: {
          id: result.adminUser._id.toString(),
          name: result.adminUser.name,
          email: result.adminUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("SuperAdmin create tenant failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to provision tenant space" },
      { status: 400 }
    );
  }
}
