import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    
    // Safety check - require secret query parameter
    if (secret !== process.env.SEED_SECRET && secret !== "horizon_seed_2026") {
      return NextResponse.json({ error: "Unauthorized seed attempt" }, { status: 401 });
    }

    await dbConnect();

    // 1. Seed Super Admin
    const superAdminEmail = "admin@horizon.com";
    const existingAdmin = await User.findOne({ email: superAdminEmail });

    let adminCreated = false;
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("adminpassword123", salt);

      await User.create({
        name: "Super Admin",
        email: superAdminEmail,
        password: hashedPassword,
        provider: "credentials",
        role: "super_admin",
        status: "active",
      });
      adminCreated = true;
    }

    return NextResponse.json({
      success: true,
      message: "Seeding completed successfully",
      details: {
        adminCreated,
        adminEmail: superAdminEmail,
      }
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
