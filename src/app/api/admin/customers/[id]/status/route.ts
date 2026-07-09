import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { isAdminRole } from "@/lib/rbac";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !isAdminRole((session.user as { role?: string }).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { status } = body;

        if (!status || !["active", "suspended"].includes(status)) {
            return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
        }

        await dbConnect();

        const updatedUser = await User.findByIdAndUpdate(params.id, { status }, { new: true }).select("-password");
        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ customer: updatedUser });
    } catch (error: unknown) {
        console.error("Error updating customer status:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update customer status" }, { status: 500 });
    }
}
