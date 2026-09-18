import assert from "node:assert";
import { detectRequestedServices } from "../lib/requestedServices";

console.log("🧪 Running Unit Tests: Requested Services Detection...");

// Test 1: Booking with private-driver transport mode in pricingInputs
const req1 = {
  packageName: "Highlands Tour",
  pricingInputs: {
    transportMode: "private-driver",
    addOns: ["breakfast"],
  },
  specialRequests: "### 🌟 Custom Calculator Specifications\n- **Transport Mode**: Private Car & Local Driver (+$75/day flat)",
};
const res1 = detectRequestedServices(req1);
assert.strictEqual(res1.driverRequested, true, "Driver should be detected from pricingInputs");
assert.strictEqual(res1.guideRequested, false, "Guide should not be requested");
assert.strictEqual(res1.hasAnyServiceRequested, true);
console.log("  ✓ Test 1 Passed: Detected driver from pricingInputs");

// Test 2: Booking with guide in addOns
const req2 = {
  packageName: "Cultural Triangle",
  pricingInputs: {
    transportMode: "self-drive",
    addOns: ["guide", "dinner"],
  },
  specialRequests: "### 🌟 Custom Calculator Specifications\n- **Selected Add-ons**: Private Tour Guide (+$30/day), Curated Dinner Experience",
};
const res2 = detectRequestedServices(req2);
assert.strictEqual(res2.driverRequested, false, "Driver should not be requested");
assert.strictEqual(res2.guideRequested, true, "Guide should be detected from addOns");
console.log("  ✓ Test 2 Passed: Detected tour guide from addOns");

// Test 3: Booking with both driver and guide requested
const req3 = {
  packageName: "Ceylon Grand Explorer",
  pricingInputs: {
    transportMode: "private-driver",
    addOns: ["guide"],
  },
  specialRequests: "### 🌟 Custom Calculator Specifications\n- **Transport Mode**: Private Car & Local Driver\n- **Selected Add-ons**: Private Tour Guide",
  driver: { name: "Kasun Silva", email: "kasun@example.com" },
};
const res3 = detectRequestedServices(req3);
assert.strictEqual(res3.driverRequested, true);
assert.strictEqual(res3.driverAssigned, true);
assert.strictEqual(res3.driverName, "Kasun Silva");
assert.strictEqual(res3.guideRequested, true);
assert.strictEqual(res3.guideAssigned, false);
console.log("  ✓ Test 3 Passed: Detected both driver (assigned) and guide (needed)");

// Test 4: Booking with special requests text mention
const req4 = {
  packageName: "Standard Package",
  specialRequests: "We are traveling with elderly parents and urgently need a car driver who speaks English. Also tour guide needed for Sigiriya.",
};
const res4 = detectRequestedServices(req4);
assert.strictEqual(res4.driverRequested, true, "Driver should be detected from traveler notes");
assert.strictEqual(res4.guideRequested, true, "Guide should be detected from traveler notes");
console.log("  ✓ Test 4 Passed: Detected driver & guide from free-text traveler notes");

// Test 5: Standard tour with neither requested
const req5 = {
  packageName: "Beach Holiday",
  specialRequests: "No special requirements.",
};
const res5 = detectRequestedServices(req5);
assert.strictEqual(res5.driverRequested, false);
assert.strictEqual(res5.guideRequested, false);
assert.strictEqual(res5.hasAnyServiceRequested, false);
console.log("  ✓ Test 5 Passed: Standard booking correctly reports no service requested");

console.log("🎉 All Requested Services Detection tests passed successfully!\n");
