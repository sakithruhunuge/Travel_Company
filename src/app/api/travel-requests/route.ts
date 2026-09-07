import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { resolveTenantId } from "@/lib/tenantContext";
import User from "@/models/User";
import TravelRequest from "@/models/TravelRequest";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const sessionUser = session.user as any;
    let userId = sessionUser.id;
    const userEmail = sessionUser.email;
    const tenantId = await resolveTenantId(sessionUser);
    const userRole = sessionUser.role;

    const isAdmin = userRole === "tenant_admin" || userRole === "super_admin" || userRole === "admin";

    if (!userId && userEmail) {
      const dbUser = await User.findOne({ email: userEmail });
      if (dbUser) {
        userId = dbUser._id.toString();
      }
    }

    if (!tenantId && !isAdmin) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    let query: Record<string, any> = {};

    if (userRole === "super_admin") {
      // Super admin views all travel requests across the entire platform
      query = {};
    } else if (isAdmin) {
      // Tenant Admin views all bookings for their tenant (including default-tenant for ceylon)
      if (tenantId) {
        const tenantObjIds = [new mongoose.Types.ObjectId(tenantId)];
        if (tenantId === "6a505fc356877edee50d3f6c" || tenantId === "6a4f8835986947243fe29df7") {
          tenantObjIds.push(new mongoose.Types.ObjectId("6a4f8835986947243fe29df7"));
          tenantObjIds.push(new mongoose.Types.ObjectId("6a505fc356877edee50d3f6c"));
        }
        query = { tenantId: { $in: tenantObjIds } };
      } else {
        query = {};
      }
    } else {
      // Customers view only their own requests under their tenant
      const userQueryConditions: Record<string, unknown>[] = [];
      if (userId) userQueryConditions.push({ userId });
      if (userEmail) userQueryConditions.push({ userEmail });

      const tenantFilter = tenantId ? { tenantId: new mongoose.Types.ObjectId(tenantId) } : {};
      query = userQueryConditions.length > 0
        ? { ...tenantFilter, $or: userQueryConditions }
        : { ...tenantFilter, userId };
    }

    const requests = await TravelRequest.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ requests });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load travel requests" }, { status: 500 });
  }
}
