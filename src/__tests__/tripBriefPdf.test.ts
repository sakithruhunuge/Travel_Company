import assert from "node:assert";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import TripBriefDocument from "../components/pdf/TripBriefDocument";
import { buildDriverRoutePlan } from "../lib/distanceMatrix";

async function testTripBriefPdf() {
  console.log("🧪 Testing TripBriefDocument PDF rendering with Driver Route & Distances...");

  const routePlan = buildDriverRoutePlan(["Sigiriya", "Kandy", "Ella"]);

  const element = React.createElement(TripBriefDocument, {
    bookingId: "64b1f2e3d4c5a6b7c8d9e0f1",
    generatedDate: "Sep 7, 2026",
    tenantName: "Serendib Expeditions",
    primaryColor: "#0B7C8A",
    secondaryColor: "#041A16",
    recipientName: "Sunil Perera",
    recipientRole: "Car Driver",
    customerName: "Alice Walker",
    customerEmail: "alice@example.com",
    numberOfTravelers: 2,
    packageName: "Heritage & Highlands Explorer",
    preferredStartDate: "Sep 15, 2026",
    destinations: "Sigiriya, Kandy, Ella",
    duration: "5 Days / 4 Nights",
    hotelTier: "Luxury 4-5 Star",
    transportMode: "Private Car & Driver",
    excursions: "Sigiriya Rock Climb, Temple of the Tooth",
    addOns: "Airport Express Transfer",
    specialRequests: "Arriving on flight UL504 at 08:30 AM. Need child seat in car.",
    agencyNotes: "Pick up at Colombo Airport Gate 3. Guest has requested vegetarian dining recommendations.",
    totalPrice: 1850,
    routePlan,
  });

  const buffer = await renderToBuffer(element as any);
  assert.ok(buffer.length > 1000, "PDF buffer should be generated and larger than 1000 bytes");
  console.log(`  ✓ PDF rendered successfully: ${buffer.length} bytes`);
  console.log("🎉 Trip Brief PDF test passed successfully!\n");
}

testTripBriefPdf().catch((err) => {
  console.error("PDF test failed:", err);
  process.exit(1);
});
