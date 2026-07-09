import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Package from "@/models/Package";
import { isAdminRole } from "@/lib/rbac";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !isAdminRole((session.user as { role?: string }).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        await dbConnect();

        const updatedPkg = await Package.findByIdAndUpdate(params.id, body, { new: true });
        if (!updatedPkg) {
            return NextResponse.json({ error: "Package not found" }, { status: 404 });
        }

        return NextResponse.json({ package: updatedPkg });
    } catch (error: unknown) {
        console.error("Error updating package:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update package" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !isAdminRole((session.user as { role?: string }).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const deletedPkg = await Package.findByIdAndDelete(params.id);
        if (!deletedPkg) {
            return NextResponse.json({ error: "Package not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Package deleted successfully" });
    } catch (error: unknown) {
        console.error("Error deleting package:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete package" }, { status: 500 });
    }
}
