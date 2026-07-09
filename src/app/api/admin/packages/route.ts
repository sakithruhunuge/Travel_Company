import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Package from "@/models/Package";
import { sriLankaPackages } from "@/data/packages";
import { isAdminRole } from "@/lib/rbac";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !isAdminRole((session.user as { role?: string }).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        let packages = await Package.find().sort({ createdAt: -1 });

        // Self-seed from static list if collection is empty
        if (packages.length === 0) {
            const seedData = sriLankaPackages.map((pkg) => ({
                name: pkg.name,
                duration: pkg.duration,
                destinations: pkg.destinations,
                includes: pkg.includes,
                image: pkg.image,
                priceRange: pkg.priceRange,
                rating: pkg.rating,
                isPopular: pkg.id === "hill-country" || pkg.id === "grand-tour"
            }));
            await Package.insertMany(seedData);
            packages = await Package.find().sort({ createdAt: -1 });
        }

        return NextResponse.json({ packages });
    } catch (error: unknown) {
        console.error("Error fetching admin packages:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load packages" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !isAdminRole((session.user as { role?: string }).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, duration, destinations, includes, image, priceRange } = body;

        if (!name || !duration || !priceRange || !image) {
            return NextResponse.json({ error: "Missing required package parameters" }, { status: 400 });
        }

        await dbConnect();

        const newPkg = await Package.create({
            name,
            duration,
            destinations: Array.isArray(destinations) ? destinations : destinations.split(",").map((s: string) => s.trim()),
            includes: Array.isArray(includes) ? includes : includes.split(",").map((s: string) => s.trim()),
            image,
            priceRange,
            rating: "5.0",
            isPopular: false
        });

        return NextResponse.json({ package: newPkg });
    } catch (error: unknown) {
        console.error("Error creating package:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create package" }, { status: 500 });
    }
}
