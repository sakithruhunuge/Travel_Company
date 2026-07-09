import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { dbConnect } from "@/lib/mongodb";
import { resolveTenant } from "@/lib/tenantResolver";
import { tenantScope } from "@/lib/tenantContext";

export async function GET() {
  try {
    await dbConnect();

    // 1. Resolve host and tenant context
    const hostname = headers().get("host") || "";
    const tenant = await resolveTenant({ hostname });

    if (tenant.isAdmin) {
      return NextResponse.json({ packages: [] });
    }

    // 2. Fetch active packages scoped to the tenant
    const db = tenantScope(tenant.id!);
    const packages = await db.Package.find({ status: "active" }).lean();

    // Map database packages to match the client-side TravelPackage interface properties
    const mappedPackages = packages.map((pkg: any) => ({
      id: pkg.slug, // Mapped slug to id for client compatibility
      name: pkg.name,
      duration: pkg.duration,
      destinations: pkg.destinations,
      includes: pkg.includes,
      image: pkg.image,
      priceRange: pkg.priceRange,
      rating: pkg.rating,
      status: pkg.status,
    }));

    return NextResponse.json({ packages: mappedPackages });
  } catch (error) {
    console.error("Failed to fetch packages API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
