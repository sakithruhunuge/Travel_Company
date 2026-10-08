import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

// GET /api/driver-guide/applicants?status=pending|approved|rejected|all
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const userRole = sessionUser.role;

    // Authorized roles: tenant_admin, marketing_officer, travel_agent, super_admin
    const isAuthorized = ["tenant_admin", "marketing_officer", "travel_agent", "super_admin", "admin"].includes(userRole);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Access Denied: Marketing Manager or Admin privileges required." },
        { status: 403 }
      );
    }

    const tenantId = await resolveTenantId(sessionUser);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "all";
    const typeParam = searchParams.get("employmentType"); // "freelance" | "permanent"

    const filter: any = {};
    if (statusParam && statusParam !== "all") {
      filter.approvalStatus = statusParam;
    }
    if (typeParam) {
      filter.employmentType = typeParam;
    }

    const applicants = await db.DriverGuide.find(filter)
      .populate("userId", "name email status role createdAt")
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    // Compute stats
    const allCrew = await db.DriverGuide.find({}).lean();
    const stats = {
      total: allCrew.length,
      pending: allCrew.filter((c: any) => c.approvalStatus === "pending").length,
      approved: allCrew.filter((c: any) => c.approvalStatus === "approved").length,
      rejected: allCrew.filter((c: any) => c.approvalStatus === "rejected").length,
      freelancers: allCrew.filter((c: any) => c.employmentType === "freelance").length,
    };

    return NextResponse.json({
      success: true,
      applicants,
      stats,
    });
  } catch (error: any) {
    console.error("Failed to load crew applicants:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
