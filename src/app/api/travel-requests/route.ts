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

        const requests = await TravelRequest.find({ userId }).sort({ createdAt: -1 }).lean();

        return NextResponse.json({ requests });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to load travel requests" }, { status: 500 });
    }
}
