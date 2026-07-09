import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import TravelRequest from "@/models/TravelRequest";
import { isAdminRole } from "@/lib/rbac";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !isAdminRole((session.user as { role?: string }).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const requests = await TravelRequest.find().sort({ createdAt: -1 });

        return NextResponse.json({ requests });
    } catch (error: unknown) {
        console.error("Error fetching admin requests:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load requests" }, { status: 500 });
    }
}
