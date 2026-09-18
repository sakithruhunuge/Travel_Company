import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { resolveTenantId } from "@/lib/tenantContext";
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
    const userId = sessionUser.id;
    const tenantId = await resolveTenantId(sessionUser);
    const userRole = sessionUser.role;

    const isAdmin = userRole === "tenant_admin" || userRole === "super_admin" || userRole === "admin";

    if (!userId) {
      return NextResponse.json({ error: "Missing user identity" }, { status: 400 });
    }

    if (!tenantId && !isAdmin) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    let query: Record<string, any> = {};

    if (userRole === "super_admin") {
      query = {};
    } else if (isAdmin) {
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
      const tenantFilter = tenantId ? { tenantId: new mongoose.Types.ObjectId(tenantId) } : {};
      query = { ...tenantFilter, userId };
    }

    const [total, pending, approved, rejected] = await Promise.all([
      TravelRequest.countDocuments(query),
      TravelRequest.countDocuments({ ...query, status: "pending" }),
      TravelRequest.countDocuments({ ...query, status: "approved" }),
      TravelRequest.countDocuments({ ...query, status: "rejected" }),
    ]);

    return NextResponse.json({
      stats: { total, pending, approved, rejected },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
