import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const sessionUser = session.user;
    let userId = sessionUser.id;
    const userEmail = sessionUser.email;
    const tenantId = await resolveTenantId(sessionUser);
    const userRole = sessionUser.role;

    if (!userId && userEmail) {
      const dbUser = await User.findOne({ email: userEmail });
      if (dbUser) {
        userId = dbUser._id.toString();
      }
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    const db = tenantScope(tenantId);
    // Dual-scoping: Tenant Admin views all bookings, Customer views only their own
    const userQueryConditions: Record<string, unknown>[] = [];
    if (userId) userQueryConditions.push({ userId });
    if (userEmail) userQueryConditions.push({ userEmail });

    const query =
      userRole === "tenant_admin"
        ? {}
        : userQueryConditions.length > 0
        ? { $or: userQueryConditions }
        : { userId };

    const requests = await db.TravelRequest.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ requests });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load travel requests" }, { status: 500 });
  }
}
