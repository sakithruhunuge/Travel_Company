import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import TravelRequest from "@/models/TravelRequest";
import { isAdminRole } from "@/lib/rbac";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !isAdminRole((session.user as { role?: string }).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { status } = body;

        if (!status || !["pending", "approved", "rejected"].includes(status)) {
            return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
        }

        await dbConnect();

        const updatedRequest = await TravelRequest.findByIdAndUpdate(params.id, { status }, { new: true });
        if (!updatedRequest) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        return NextResponse.json({ request: updatedRequest });
    } catch (error: unknown) {
        console.error("Error updating request:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update request" }, { status: 500 });
    }
}
