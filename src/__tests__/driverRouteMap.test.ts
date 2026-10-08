import assert from "node:assert";
import {
  generateGoogleMapsRouteUrl,
  generateGoogleMapsLegUrl,
} from "../lib/googleMapsUrl";
import {
  buildDriverRoutePlan,
  getDistanceBetween,
} from "../lib/distanceMatrix";

console.log("🧪 Running Unit Tests: Driver Route Map & Google Maps Navigation...");

// Test 1: Generate Google Maps Directions URL for 2-stop journey
const twoStopUrl = generateGoogleMapsRouteUrl(["Colombo", "Kandy"]);
assert.ok(twoStopUrl.startsWith("https://www.google.com/maps/dir/?api=1"), "Should have Google Maps Directions API base");
assert.ok(twoStopUrl.includes("origin=Colombo%2C+Sri+Lanka"), "Should encode origin with Sri Lanka suffix");
assert.ok(twoStopUrl.includes("destination=Kandy%2C+Sri+Lanka"), "Should encode destination with Sri Lanka suffix");
assert.ok(twoStopUrl.includes("travelmode=driving"), "Should specify driving mode");
assert.ok(twoStopUrl.includes("dir_action=navigate"), "Should include navigation action");
console.log("  ✓ Test 1 Passed: 2-stop Google Maps URL correctly generated");

// Test 2: Generate Google Maps Directions URL for multi-stop journey with waypoints
const multiStopUrl = generateGoogleMapsRouteUrl(["Colombo", "Sigiriya", "Kandy", "Nuwara Eliya", "Galle"]);
assert.ok(multiStopUrl.includes("origin=Colombo%2C+Sri+Lanka"), "Origin should be Colombo");
assert.ok(multiStopUrl.includes("destination=Galle%2C+Sri+Lanka"), "Destination should be Galle");
assert.ok(multiStopUrl.includes("waypoints="), "Should contain intermediate waypoints parameter");
// Check waypoints contains intermediate stops
const decodedUrl = decodeURIComponent(multiStopUrl.replace(/\+/g, " "));
assert.ok(decodedUrl.includes("Sigiriya, Sri Lanka|Kandy, Sri Lanka|Nuwara Eliya, Sri Lanka"), "Intermediate stops should be pipe-separated waypoints");
console.log("  ✓ Test 2 Passed: Multi-stop journey correctly creates intermediate waypoints");

// Test 3: Coordinate-based location points
const coordUrl = generateGoogleMapsRouteUrl([
  { name: "Colombo Fort", lat: 6.9344, lng: 79.8428 },
  { name: "Kandy Lake", lat: 7.2936, lng: 80.6413 },
  { name: "Ella Gap", lat: 6.8667, lng: 81.0466 },
]);
assert.ok(coordUrl.includes("origin=6.9344%2C79.8428"), "Origin should use lat,lng coordinates when provided");
assert.ok(coordUrl.includes("destination=6.8667%2C81.0466"), "Destination should use lat,lng coordinates when provided");
assert.ok(decodeURIComponent(coordUrl).includes("waypoints=7.2936,80.6413"), "Waypoint should use lat,lng");
console.log("  ✓ Test 3 Passed: Coordinate points formatted accurately for turn-by-turn navigation");

// Test 4: Single leg navigation URL
const legUrl = generateGoogleMapsLegUrl("Ella", "Yala");
assert.ok(legUrl.includes("origin=Ella%2C+Sri+Lanka"), "Leg origin should be Ella");
assert.ok(legUrl.includes("destination=Yala%2C+Sri+Lanka"), "Leg destination should be Yala");
console.log("  ✓ Test 4 Passed: Individual leg navigation URL generated");

// Test 5: Route plan and total distance consistency
const testDestinations = ["Colombo", "Kandy", "Nuwara Eliya", "Ella"];
const routePlan = buildDriverRoutePlan(testDestinations);
assert.strictEqual(routePlan.destinationStops.length, 4);
assert.strictEqual(routePlan.segments.length, 3);
assert.ok(routePlan.totalDistanceKm > 200, "Total distance should be calculated across all segments");
console.log(`  ✓ Test 5 Passed: Route plan verified (${routePlan.totalDistanceKm} km, ~${routePlan.totalDriveTimeFormatted})`);

console.log("🎉 All Driver Route Map & Google Maps tests passed successfully!");
