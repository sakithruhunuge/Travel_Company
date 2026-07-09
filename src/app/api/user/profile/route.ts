import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function PATCH(request: Request) {
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

        const body = await request.json();
        const { name, image } = body;

        if (typeof name !== "string" || name.trim().length < 2) {
            return NextResponse.json({ error: "A valid name is required" }, { status: 400 });
        }

        const updateData: { name: string; image?: string } = { name: name.trim() };
        if (typeof image === "string" && !image.startsWith("/api/user/avatar/")) {
            updateData.image = image;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
