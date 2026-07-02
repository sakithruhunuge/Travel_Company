import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as { id?: string }).id;
        if (!userId) {
            return NextResponse.json({ error: "Missing user identity" }, { status: 400 });
        }

        const body = await request.json();
        const { password } = body;

        if (typeof password !== "string" || password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
        }

        await dbConnect();
        const dbUser = await User.findById(userId);

        if (!dbUser || dbUser.provider !== "credentials") {
            return NextResponse.json({ error: "Password update is only available for email/password accounts" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        dbUser.password = hashedPassword;
        await dbUser.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }
}
