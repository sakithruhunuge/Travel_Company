import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { tenantScope, resolveTenantId } from "@/lib/tenantContext";

export const runtime = "nodejs";

const DEFAULT_CREW = [
  {
    name: "Sunil Jayawardena",
    email: "sunil.j@travelcrew.lk",
    phone: "+94 77 123 4567",
    role: "driver",
    licenseNumber: "DRV-LK-9021",
    languages: ["English", "Sinhala"],
    vehicleDetails: {
      category: "Van",
      plateNumber: "WP-CAB-4421",
      model: "Toyota KDH Commuter (10-Seater)",
      capacity: 10,
    },
    rating: 4.9,
    status: "available",
    activeToursCount: 1,
    notes: "Experienced chauffeur with 12 years in Hill Country & Cultural Triangle routes.",
  },
  {
    name: "Dinesh Mendis",
    email: "dinesh.m@travelcrew.lk",
    phone: "+94 71 987 6543",
    role: "both",
    licenseNumber: "GUI-LK-3310",
    languages: ["English", "German", "Sinhala"],
    vehicleDetails: {
      category: "Sedan",
      plateNumber: "WP-KX-8812",
      model: "Toyota Premio Executive (4-Seater)",
      capacity: 4,
    },
    rating: 5.0,
    status: "available",
    activeToursCount: 0,
    notes: "National Tour Guide Lecturer certified by SLTDA. Fluent in German & Wildlife specialist.",
  },
  {
    name: "Rohan Perera",
    email: "rohan.p@travelcrew.lk",
    phone: "+94 76 554 3321",
    role: "tour_guide",
    licenseNumber: "GUI-LK-7742",
    languages: ["English", "French", "Mandarin"],
    rating: 4.8,
    status: "available",
    activeToursCount: 0,
    notes: "Expert cultural guide specializing in Sigiriya, Polonnaruwa, and Kandy heritage.",
  },
  {
    name: "Chaminda Silva",
    email: "chaminda.s@travelcrew.lk",
    phone: "+94 75 332 1199",
    role: "driver",
    licenseNumber: "DRV-LK-6651",
    languages: ["English", "Sinhala"],
    vehicleDetails: {
      category: "SUV",
      plateNumber: "WP-CBB-1902",
      model: "Mitsubishi Montero 4WD (6-Seater)",
      capacity: 6,
    },
    rating: 4.9,
    status: "available",
    activeToursCount: 0,
    notes: "Safari and off-road driving specialist for Yala and Wilpattu national parks.",
  },
];

// GET /api/driver-guide
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    const tenantId = await resolveTenantId(sessionUser);

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context missing" }, { status: 400 });
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    let crew = await db.DriverGuide.find({}).lean();

    // Auto-seed if empty for this tenant
    if (!crew || crew.length === 0) {
      const seeded: any = await db.DriverGuide.create(DEFAULT_CREW);
      crew = Array.isArray(seeded)
        ? seeded.map((doc: any) => (doc.toObject ? doc.toObject() : doc))
        : [seeded];
    }

    return NextResponse.json({
      success: true,
      crew,
    });
  } catch (error: any) {
    console.error("DriverGuide GET error:", error);
    return NextResponse.json({ error: error?.message || "Failed to load crew" }, { status: 500 });
  }
}

// POST /api/driver-guide
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    const tenantId = await resolveTenantId(sessionUser);

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context missing" }, { status: 400 });
    }

    await dbConnect();
    const db = tenantScope(tenantId);

    const body = await request.json();
    const newMember = await db.DriverGuide.create(body);

    return NextResponse.json({
      success: true,
      member: newMember,
    });
  } catch (error: any) {
    console.error("DriverGuide POST error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create crew member" }, { status: 500 });
  }
}
