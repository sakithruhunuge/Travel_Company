import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope } from "@/lib/tenantContext";

// GET /api/travel-requests/[id] - Load request details
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const sessionUser = session.user as any;
    const userId = sessionUser.id;
    const tenantId = sessionUser.tenantId;
    const userRole = sessionUser.role;

    if (!userId) {
      return NextResponse.json({ error: "Missing user identity" }, { status: 400 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    const db = tenantScope(tenantId);
    // Dual-scoping detail lookup
    const query = userRole === "tenant_admin" ? { _id: params.id } : { _id: params.id, userId };
    const requestDoc = await db.TravelRequest.findOne(query).lean();

    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ request: requestDoc });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load request details" }, { status: 500 });
  }
}

// PUT /api/travel-requests/[id] - Tenant Admin updates travel request status (Approve / Reject)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const userRole = sessionUser.role;
    const tenantId = sessionUser.tenantId;

    // Guard: Only Tenant Admin is authorized to change request status
    if (userRole !== "tenant_admin") {
      return NextResponse.json({ error: "Access Denied: Tenant Admin role required" }, { status: 403 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    await dbConnect();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { status } = body;
    if (!status || !["pending", "approved", "rejected", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const db = tenantScope(tenantId);

    // Scoped update prevents leakage
    const updatedRequest = await db.TravelRequest.findOneAndUpdate(
      { _id: params.id },
      { status },
      { new: true }
    );

    if (!updatedRequest) {
      return NextResponse.json({ error: "Request not found under this tenant" }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error("Failed to update travel request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
