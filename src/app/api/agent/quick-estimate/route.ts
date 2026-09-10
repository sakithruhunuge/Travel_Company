import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/agent/quick-estimate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      days = 7,
      travelers = 2,
      hotelTier = "4-Star Premium",
      vehicleType = "Van",
      commissionPercent = 10,
    } = body;

    const numDays = Math.max(1, Number(days) || 7);
    const numPax = Math.max(1, Number(travelers) || 2);
    const numRooms = Math.ceil(numPax / 2);
    const commPct = Math.max(0, Math.min(50, Number(commissionPercent) || 10));

    // Vehicle rates per day
    let dailyVehicleRate = 75; // Standard Sedan
    if (vehicleType.toLowerCase().includes("van")) dailyVehicleRate = 105;
    else if (vehicleType.toLowerCase().includes("coach") || vehicleType.toLowerCase().includes("bus")) dailyVehicleRate = 175;
    else if (vehicleType.toLowerCase().includes("luxury") || vehicleType.toLowerCase().includes("suv")) dailyVehicleRate = 145;

    const totalVehicleCost = dailyVehicleRate * numDays;

    // Hotel rates per room/night
    let roomRatePerNight = 90; // 3-star
    if (hotelTier.includes("4-Star")) roomRatePerNight = 135;
    else if (hotelTier.includes("5-Star")) roomRatePerNight = 220;

    const totalHotelCost = roomRatePerNight * (numDays - 1) * numRooms;

    // Driver & Guide allowance per day
    const guideAllowancePerDay = 35;
    const totalCrewCost = guideAllowancePerDay * numDays;

    // Estimated entrance fees & activities per traveler
    const activitiesCostPerPerson = numDays * 18;
    const totalActivitiesCost = activitiesCostPerPerson * numPax;

    // Subtotal Net Cost (Agency base cost)
    const netBaseCost = totalVehicleCost + totalHotelCost + totalCrewCost + totalActivitiesCost;

    // Agent Commission / Markup
    const commissionAmount = (netBaseCost * commPct) / 100;
    const suggestedRetailTotal = netBaseCost + commissionAmount;
    const perPersonPrice = suggestedRetailTotal / numPax;

    return NextResponse.json({
      success: true,
      estimate: {
        days: numDays,
        travelers: numPax,
        rooms: numRooms,
        hotelTier,
        vehicleType,
        commissionPercent: commPct,
        breakdown: {
          vehicleTransit: totalVehicleCost,
          hotelAccommodations: totalHotelCost,
          crewAllowances: totalCrewCost,
          excursionsAndPasses: totalActivitiesCost,
        },
        netCost: Math.round(netBaseCost),
        commissionAmount: Math.round(commissionAmount),
        suggestedRetailTotal: Math.round(suggestedRetailTotal),
        pricePerPerson: Math.round(perPersonPrice),
        currency: "USD",
      },
    });
  } catch (error: any) {
    console.error("Agent quick estimate error:", error);
    return NextResponse.json({ error: "Failed to compute agent estimate" }, { status: 500 });
  }
}
