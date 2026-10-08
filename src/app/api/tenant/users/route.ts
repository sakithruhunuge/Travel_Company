import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";
import bcrypt from "bcryptjs";

// GET /api/tenant/users - Lists users (staff and/or customers) under this organization
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const userRole = sessionUser.role;
    const tenantId = await resolveTenantId(sessionUser);

    // Guard: Tenant Admin access only
    if (userRole !== "tenant_admin" && userRole !== "super_admin") {
      return NextResponse.json({ error: "Access Denied: Tenant Admin role required" }, { status: 403 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "staff" | "customer" | "all"
    const role = searchParams.get("role");

    let filter: any = {};
    if (role) {
      filter.role = role;
    } else if (type === "staff") {
      filter.role = { $in: ["marketing_officer", "travel_agent"] };
    } else if (type === "customer") {
      filter.role = "customer";
    }

    const users = await db.User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Failed to load tenant users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/tenant/users - Admin creates new staff user (e.g. Marketing Officer)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const userRole = sessionUser.role;
    const tenantId = await resolveTenantId(sessionUser);

    if (userRole !== "tenant_admin" && userRole !== "super_admin") {
      return NextResponse.json({ error: "Access Denied: Tenant Admin role required" }, { status: 403 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, password, role = "marketing_officer", status = "active" } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const allowedRoles = ["marketing_officer", "travel_agent", "customer"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists under this tenant
    const existing = await db.User.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists in your organization" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: any = await db.User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      status: status === "suspended" ? "suspended" : "active",
      provider: "credentials",
    });

    return NextResponse.json({
      success: true,
      message: `${role === "marketing_officer" ? "Marketing Officer" : "User"} account created successfully`,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        provider: newUser.provider,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Failed to create tenant user:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/tenant/users - Update user status or role
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const userRole = sessionUser.role;
    const tenantId = await resolveTenantId(sessionUser);

    if (userRole !== "tenant_admin" && userRole !== "super_admin") {
      return NextResponse.json({ error: "Access Denied: Tenant Admin role required" }, { status: 403 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    const body = await request.json();
    const { id, status, role, password } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    const updateData: any = {};
    if (status && ["active", "suspended", "pending"].includes(status)) {
      updateData.status = status;
    }
    if (role && ["marketing_officer", "travel_agent", "customer"].includes(role)) {
      updateData.role = role;
    }
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await db.User.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Failed to update tenant user:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/tenant/users?id=... - Remove a user
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const userRole = sessionUser.role;
    const tenantId = await resolveTenantId(sessionUser);

    if (userRole !== "tenant_admin" && userRole !== "super_admin") {
      return NextResponse.json({ error: "Access Denied: Tenant Admin role required" }, { status: 403 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (id === sessionUser.id) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 });
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    const deleted = await db.User.deleteOne({ _id: id });
    if (!deleted.deletedCount) {
      return NextResponse.json({ error: "User not found or already deleted" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete tenant user:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
