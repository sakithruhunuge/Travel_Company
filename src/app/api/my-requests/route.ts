import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import TravelRequest from "@/models/TravelRequest";

export async function GET() {
  try {
    // Check authentication status
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const sessionUser = session.user as { id?: string };
    if (!sessionUser.id) {
      return NextResponse.json({ error: "Invalid user session ID" }, { status: 400 });
    }

    await dbConnect();

    // Fetch requests made by this specific user
    const requests = await TravelRequest.find({ userId: sessionUser.id }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Fetch requests API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
