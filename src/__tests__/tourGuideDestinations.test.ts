import assert from "node:assert";
import { getTourGuideDestination } from "../constants/tourGuideDestinations";

console.log("🧪 Running Unit Tests: Tour Guide Destination Knowledge Base...");

// Test 1: Exact matches
const sigiriya = getTourGuideDestination("Sigiriya");
assert.strictEqual(sigiriya.name, "Sigiriya");
assert.strictEqual(sigiriya.category, "Cultural & Heritage");
assert.ok(sigiriya.briefDescription.includes("King Kashyapa"));
assert.ok(sigiriya.keyHighlights.length >= 3);
assert.ok(sigiriya.guideTalkingPoints.length >= 2);
assert.strictEqual(sigiriya.image, "/images/sigiriya.png");
console.log("  ✓ Test 1 Passed: Sigiriya details resolved accurately");

// Test 2: Dambulla & Kandy
const dambulla = getTourGuideDestination("Dambulla");
assert.strictEqual(dambulla.name, "Dambulla");
assert.ok(dambulla.briefDescription.includes("cave temple"));
assert.ok(dambulla.visitorTips.includes("dress code"));

const kandy = getTourGuideDestination("Kandy");
assert.strictEqual(kandy.name, "Kandy");
assert.ok(kandy.briefDescription.includes("Tooth Relic"));
console.log("  ✓ Test 2 Passed: Dambulla & Kandy details resolved accurately");

// Test 3: Wildlife & Yala
const yala = getTourGuideDestination("Yala");
assert.strictEqual(yala.name, "Yala");
assert.strictEqual(yala.category, "Wildlife Safari");
assert.ok(yala.briefDescription.includes("leopard"));
console.log("  ✓ Test 3 Passed: Yala safari details resolved accurately");

// Test 4: Aliases & casing
const lionRock = getTourGuideDestination("lion rock");
assert.strictEqual(lionRock.name, "Sigiriya");

const toothTemple = getTourGuideDestination("Temple of the Tooth (Kandy)");
assert.strictEqual(toothTemple.name, "Kandy");

const airport = getTourGuideDestination("Negombo (BIA Airport)");
assert.strictEqual(airport.name, "Negombo");
console.log("  ✓ Test 4 Passed: Destination aliases handled properly");

// Test 5: Custom destination fallback
const custom = getTourGuideDestination("Unknown Scenic Peak");
assert.strictEqual(custom.name, "Unknown Scenic Peak");
assert.ok(custom.briefDescription.includes("allocated destination"));
assert.ok(custom.keyHighlights.length > 0);
assert.ok(custom.guideTalkingPoints.length > 0);
console.log("  ✓ Test 5 Passed: Dynamic fallback generated for custom places");

console.log("🎉 All 5 Tour Guide Destination Knowledge Base tests passed successfully!\n");
