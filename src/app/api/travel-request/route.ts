import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import TravelRequest from "@/models/TravelRequest";

export async function POST(request: Request) {
  try {
    // Check authentication status
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { packageId, packageName, numberOfTravelers, preferredStartDate, specialRequests } = body;

    // Input Validations
    if (!packageName || typeof packageName !== "string" || packageName.trim() === "") {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 });
    }
    if (numberOfTravelers === undefined || typeof numberOfTravelers !== "number" || numberOfTravelers <= 0) {
      return NextResponse.json({ error: "Number of travelers must be a number greater than 0" }, { status: 400 });
    }
    if (!preferredStartDate || isNaN(Date.parse(preferredStartDate))) {
      return NextResponse.json({ error: "A valid preferred start date is required" }, { status: 400 });
    }

    const sessionUser = session.user as { id?: string; name?: string | null; email?: string | null };

    if (!sessionUser.id || !sessionUser.email || !sessionUser.name) {
      return NextResponse.json({ error: "Missing required user profile information in session" }, { status: 400 });
    }

    // Save customized travel request to MongoDB
    const newRequest = await TravelRequest.create({
      userId: sessionUser.id,
      userName: sessionUser.name,
      userEmail: sessionUser.email,
      packageId: packageId || undefined,
      packageName: packageName.trim(),
      numberOfTravelers,
      preferredStartDate: new Date(preferredStartDate),
      specialRequests: specialRequests || "",
      status: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Travel request submitted successfully",
        data: newRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Database or API route error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
