import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import TravelRequest from "@/models/TravelRequest";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
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

        const requestDoc = await TravelRequest.findOne({ _id: params.id, userId });
        if (!requestDoc) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        if (requestDoc.status !== "pending") {
            return NextResponse.json({ error: "Only pending requests can be cancelled" }, { status: 400 });
        }

        requestDoc.status = "rejected";
        await requestDoc.save();

        return NextResponse.json({ success: true, request: requestDoc });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to cancel request" }, { status: 500 });
    }
}
