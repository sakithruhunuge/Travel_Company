import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Tenant from "@/models/Tenant";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const customDomain = searchParams.get("customDomain");

    if (!slug && !customDomain) {
      return NextResponse.json(
        { error: "Missing resolution parameter (slug or customDomain)" },
        { status: 400 }
      );
    }

    await dbConnect();

    let tenant = null;

    if (slug) {
      tenant = await Tenant.findOne({ slug }).lean();
    } else if (customDomain) {
      tenant = await Tenant.findOne({ customDomain }).lean();
    }

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: (tenant as any)._id.toString(),
      slug: (tenant as any).slug,
      name: (tenant as any).name,
      status: (tenant as any).status,
      isolation: (tenant as any).isolation,
      branding: (tenant as any).branding,
    });
  } catch (error) {
    console.error("Database lookup error in Tenant Resolution API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
