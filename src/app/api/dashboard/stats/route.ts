import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import TravelRequest from "@/models/TravelRequest";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const userId = (session.user as { id?: string }).id;
        if (!userId) {
            return NextResponse.json({ error: "Missing user identity" }, { status: 400 });
        }

        const [total, pending, approved, rejected] = await Promise.all([
            TravelRequest.countDocuments({ userId }),
            TravelRequest.countDocuments({ userId, status: "pending" }),
            TravelRequest.countDocuments({ userId, status: "approved" }),
            TravelRequest.countDocuments({ userId, status: "rejected" }),
        ]);

        return NextResponse.json({
            stats: { total, pending, approved, rejected },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
    }
}
