import assert from "node:assert";
import { calculateTripPricing } from "../lib/pricingEngine";

console.log("🧪 Running Unit Tests: Pricing Engine...");

// Test 1: Standard calculation with luxury hotel and private driver
const breakdown1 = calculateTripPricing({
  duration: 5,
  numberOfTravelers: 4,
  destinations: ["Sigiriya", "Kandy"],
  hotelClass: "luxury",
  transportMode: "private-driver",
  season: "shoulder",
  activities: ["sigiriya-hike"],
  extraNights: 0,
  addOns: ["breakfast"],
});

assert.ok(breakdown1.totalPrice > 0, "Total price should be greater than 0");
assert.ok(breakdown1.accommodationCost > 0, "Accommodation cost should be calculated");
assert.ok(breakdown1.transportCost > 0, "Transport cost should be calculated");
console.log("  ✓ Test 1 Passed: Pricing breakdown calculation correct");

// Test 2: Hotel class pricing hierarchy (luxury > budget)
const breakdownBudget = calculateTripPricing({
  duration: 3,
  numberOfTravelers: 2,
  destinations: ["Galle"],
  hotelClass: "budget",
  transportMode: "self-drive",
  season: "shoulder",
  activities: [],
  extraNights: 0,
  addOns: [],
});

const breakdownLuxury = calculateTripPricing({
  duration: 3,
  numberOfTravelers: 2,
  destinations: ["Galle"],
  hotelClass: "luxury",
  transportMode: "self-drive",
  season: "shoulder",
  activities: [],
  extraNights: 0,
  addOns: [],
});

assert.ok(
  breakdownLuxury.accommodationCost > breakdownBudget.accommodationCost,
  "Luxury accommodation must cost more than budget"
);
console.log("  ✓ Test 2 Passed: Hotel class pricing hierarchy verified");

// Test 3: Season multiplier check (peak > off-peak)
const breakdownOffPeak = calculateTripPricing({
  duration: 4,
  numberOfTravelers: 2,
  destinations: ["Colombo"],
  hotelClass: "standard",
  transportMode: "self-drive",
  season: "off-peak",
  activities: [],
  extraNights: 0,
  addOns: [],
});

const breakdownPeak = calculateTripPricing({
  duration: 4,
  numberOfTravelers: 2,
  destinations: ["Colombo"],
  hotelClass: "standard",
  transportMode: "self-drive",
  season: "peak",
  activities: [],
  extraNights: 0,
  addOns: [],
});

assert.ok(
  breakdownPeak.totalPrice > breakdownOffPeak.totalPrice,
  "Peak season total price must exceed off-peak total price"
);
console.log("  ✓ Test 3 Passed: Season multiplier pricing hierarchy verified");

console.log("✅ All Pricing Engine Unit Tests Passed Cleanly!\n");
