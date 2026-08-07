import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import User from "@/models/User";

export async function GET() {
  try {
    // Check authentication status
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const sessionUser = session.user;
    let userId = sessionUser.id;
    const userEmail = sessionUser.email;
    const tenantId = await resolveTenantId(sessionUser);

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    await dbConnect();

    if (!userId && userEmail) {
      const dbUser = await User.findOne({ email: userEmail });
      if (dbUser) {
        userId = dbUser._id.toString();
      }
    }

    const userQueryConditions: Record<string, unknown>[] = [];
    if (userId) userQueryConditions.push({ userId });
    if (userEmail) userQueryConditions.push({ userEmail });

    if (userQueryConditions.length === 0) {
      return NextResponse.json({ error: "Invalid user session identity" }, { status: 400 });
    }

    // Fetch requests made by this specific user (or matching their email) scoped to their tenant
    const db = tenantScope(tenantId);
    const requests = await db.TravelRequest.find({ $or: userQueryConditions }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Fetch requests API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
