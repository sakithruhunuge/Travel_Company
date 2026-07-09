import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { isAdminRole } from "@/lib/rbac";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !isAdminRole((session.user as { role?: string }).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const customers = await User.find({ role: "customer" }).sort({ createdAt: -1 }).select("-password");

        return NextResponse.json({ customers });
    } catch (error: unknown) {
        console.error("Error fetching customers:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load customers" }, { status: 500 });
    }
}
