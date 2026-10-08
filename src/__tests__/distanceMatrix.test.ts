import assert from "node:assert";
import {
  buildDriverRoutePlan,
  getDistanceBetween,
  normalizeDestinationName,
  SRI_LANKA_DESTINATIONS,
} from "../lib/distanceMatrix";

console.log("🧪 Running Unit Tests: Distance Matrix & Driver Route Planner...");

// Test 1: Normalize place names and landmark aliases
assert.strictEqual(normalizeDestinationName("Temple of the Tooth, Kandy"), "Kandy");
assert.strictEqual(normalizeDestinationName("Ella Nine Arch Bridge"), "Ella");
assert.strictEqual(normalizeDestinationName("Sigiriya Lion Rock"), "Sigiriya");
assert.strictEqual(normalizeDestinationName("Mirissa Beach"), "Mirissa");
assert.strictEqual(normalizeDestinationName("BIA Airport Katunayake"), "Negombo");
console.log("  ✓ Test 1 Passed: Place names normalized correctly");

// Test 2: Known direct road distance lookups
const colomboKandy = getDistanceBetween("Colombo", "Kandy");
assert.strictEqual(colomboKandy.distanceKm, 115);
assert.ok(colomboKandy.estimatedMinutes > 120, "Drive time should be > 2 hours");

const kandySigiriya = getDistanceBetween("Kandy", "Sigiriya");
assert.strictEqual(kandySigiriya.distanceKm, 90);

const kandyElla = getDistanceBetween("Kandy", "Ella");
assert.strictEqual(kandyElla.distanceKm, 135);
console.log("  ✓ Test 2 Passed: Direct road distance lookups are accurate");

// Test 3: Route Plan for multiple destinations
const route = buildDriverRoutePlan(["Sigiriya", "Kandy", "Ella"]);
assert.strictEqual(route.destinationStops.length, 3);
assert.deepStrictEqual(route.destinationStops, ["Sigiriya", "Kandy", "Ella"]);
assert.strictEqual(route.segments.length, 3); // Colombo (Pickup) -> Sigiriya -> Kandy -> Ella
assert.strictEqual(route.segments[0].from, "Colombo (Pickup)");
assert.strictEqual(route.segments[0].to, "Sigiriya");
assert.strictEqual(route.segments[1].from, "Sigiriya");
assert.strictEqual(route.segments[1].to, "Kandy");
assert.strictEqual(route.segments[2].from, "Kandy");
assert.strictEqual(route.segments[2].to, "Ella");

// Check total distance
const expectedTotal = 175 + 90 + 135;
assert.strictEqual(route.totalDistanceKm, expectedTotal);
assert.ok(route.totalMinutes > 400, "Drive time should reflect hill-country speeds");
console.log(`  ✓ Test 3 Passed: Multi-stop driver route calculated (${route.totalDistanceKm} km, ~${route.totalDriveTimeFormatted})`);

// Test 4: Route starting in Colombo doesn't duplicate origin
const colomboRoute = buildDriverRoutePlan(["Colombo", "Galle", "Mirissa"]);
assert.strictEqual(colomboRoute.segments[0].from, "Colombo");
assert.strictEqual(colomboRoute.segments[0].to, "Galle");
assert.strictEqual(colomboRoute.segments[1].from, "Galle");
assert.strictEqual(colomboRoute.segments[1].to, "Mirissa");
assert.strictEqual(colomboRoute.totalDistanceKm, 119 + 35);
console.log(`  ✓ Test 4 Passed: Southern expressway route calculated (${colomboRoute.totalDistanceKm} km)`);

// Test 5: Comma-separated string parsing
const stringRoute = buildDriverRoutePlan("Nuwara Eliya, Ella, Yala");
assert.strictEqual(stringRoute.destinationStops.length, 3);
assert.strictEqual(stringRoute.segments.length, 3);
assert.ok(stringRoute.totalDistanceKm > 0);
console.log(`  ✓ Test 5 Passed: Comma-separated string parsing works (${stringRoute.totalDistanceKm} km)`);

// Test 6: Fallback for empty destinations
const emptyRoute = buildDriverRoutePlan("");
assert.strictEqual(emptyRoute.totalDistanceKm, 0);
assert.strictEqual(emptyRoute.destinationStops[0], "Tour Route As Directed by Customer");
console.log("  ✓ Test 6 Passed: Graceful fallback for empty route");

console.log("🎉 All Distance Matrix & Route Planner tests passed successfully!\n");
