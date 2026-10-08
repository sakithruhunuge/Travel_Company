import assert from "node:assert";

console.log("🧪 Running Unit Tests: Driver Journey Completion & History Archive...");

// Mock types representing tour and driver models
interface MockTour {
  _id: string;
  tourId: string;
  packageName: string;
  userName: string;
  status: string;
  completedAt?: Date;
  endJourneyNotes?: string;
  endJourneyOdometer?: number;
  endJourneyDropOffLocation?: string;
  inTourExpenses?: { category: string; amount: number; description: string }[];
  updatedAt?: Date;
}

interface MockCrewMember {
  _id: string;
  name: string;
  status: "available" | "on_tour" | "off_duty";
  activeToursCount: number;
}

// Logic functions mirroring API and dashboard behavior
function startJourney(tour: MockTour, crew: MockCrewMember): { tour: MockTour; crew: MockCrewMember } {
  tour.status = "active_tour";
  crew.status = "on_tour";
  return { tour, crew };
}

function endJourney(
  tour: MockTour,
  crew: MockCrewMember,
  metadata: { notes?: string; odometer?: number; dropOff?: string }
): { tour: MockTour; crew: MockCrewMember } {
  tour.status = "completed";
  tour.completedAt = new Date();
  if (metadata.notes) tour.endJourneyNotes = metadata.notes;
  if (metadata.odometer) tour.endJourneyOdometer = metadata.odometer;
  if (metadata.dropOff) tour.endJourneyDropOffLocation = metadata.dropOff;

  crew.activeToursCount = Math.max(0, crew.activeToursCount - 1);
  if (crew.activeToursCount === 0 && crew.status === "on_tour") {
    crew.status = "available";
  }

  return { tour, crew };
}

function filterActiveTours(tours: MockTour[]): MockTour[] {
  return tours.filter((t) =>
    ["allocated", "proforma_issued", "active_tour", "confirmed", "approved"].includes(t.status)
  );
}

function filterHistoryTours(tours: MockTour[]): MockTour[] {
  return tours
    .filter((t) => ["completed", "reconciling"].includes(t.status))
    .sort((a, b) => {
      const timeA = new Date(a.completedAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.completedAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
}

// -------------------------------------------------------------
// Test 1: Start Journey Transitions Status and Driver State
// -------------------------------------------------------------
const driver: MockCrewMember = {
  _id: "crew-101",
  name: "Sunil Jayawardena",
  status: "available",
  activeToursCount: 1,
};

const tour1: MockTour = {
  _id: "tour-001",
  tourId: "TRV-202609-001",
  packageName: "Scenic Hill Country Explorer",
  userName: "Alice Smith",
  status: "allocated",
  inTourExpenses: [
    { category: "ticket", amount: 40, description: "Peradeniya Botanical Gardens" },
    { category: "toll", amount: 15, description: "Southern Expressway toll" },
  ],
};

const started = startJourney(tour1, driver);
assert.strictEqual(started.tour.status, "active_tour", "Tour status should become active_tour");
assert.strictEqual(started.crew.status, "on_tour", "Crew member availability should transition to on_tour");
console.log("  ✓ Test 1 Passed: Driver successfully started journey and status changed to active_tour");

// -------------------------------------------------------------
// Test 2: End Journey Updates Tour to Completed and Records Handover Metadata
// -------------------------------------------------------------
const ended = endJourney(started.tour, started.crew, {
  notes: "Guests dropped off safely at BIA Airport. All luggage handed over with zero issues.",
  odometer: 84520,
  dropOff: "Bandaranaike International Airport (BIA)",
});

assert.strictEqual(ended.tour.status, "completed", "Tour status must be completed");
assert.ok(ended.tour.completedAt instanceof Date, "completedAt timestamp must be recorded");
assert.strictEqual(ended.tour.endJourneyOdometer, 84520, "Ending odometer must match input");
assert.strictEqual(ended.tour.endJourneyDropOffLocation, "Bandaranaike International Airport (BIA)");
assert.ok(ended.tour.endJourneyNotes?.includes("BIA Airport"), "Debrief notes must be saved");
assert.strictEqual(ended.crew.activeToursCount, 0, "Driver active tour count must be decremented");
assert.strictEqual(ended.crew.status, "available", "Driver must be set back to available after journey end");
console.log("  ✓ Test 2 Passed: End journey recorded completion timestamp, drop-off location, odometer, and notes");

// -------------------------------------------------------------
// Test 3: Tour Disappears from Active Manifest and Appears in Completed History
// -------------------------------------------------------------
const tour2: MockTour = {
  _id: "tour-002",
  tourId: "TRV-202609-002",
  packageName: "Cultural Triangle Heritage",
  userName: "Robert Brown",
  status: "active_tour",
};

const tourList = [ended.tour, tour2];

const activeManifest = filterActiveTours(tourList);
assert.strictEqual(activeManifest.length, 1, "Only 1 active tour should remain");
assert.strictEqual(activeManifest[0]._id, "tour-002", "tour-002 should be the active tour");
assert.ok(!activeManifest.some((t) => t._id === ended.tour._id), "Completed tour must not be in active manifest");

const historyManifest = filterHistoryTours(tourList);
assert.strictEqual(historyManifest.length, 1, "1 tour should be in completed history");
assert.strictEqual(historyManifest[0]._id, ended.tour._id, "The ended tour must be present in completed history");
assert.strictEqual(historyManifest[0].status, "completed");
console.log("  ✓ Test 3 Passed: Ended journey is removed from active manifest and visible in completed history");

// -------------------------------------------------------------
// Test 4: History Orders Most Recently Ended Journey First
// -------------------------------------------------------------
const olderCompletedTour: MockTour = {
  _id: "tour-000",
  tourId: "TRV-202609-000",
  packageName: "Colombo City Heritage Walk",
  userName: "David Wilson",
  status: "completed",
  completedAt: new Date(Date.now() - 86400000), // Yesterday
};

const sortedHistory = filterHistoryTours([olderCompletedTour, ended.tour]);
assert.strictEqual(sortedHistory[0]._id, ended.tour._id, "Most recently completed tour must appear first in history");
assert.strictEqual(sortedHistory[1]._id, olderCompletedTour._id, "Older tour should follow");
console.log("  ✓ Test 4 Passed: Completed history orders newest finished journey first");

// -------------------------------------------------------------
// Test 5: Field Expenses Are Preserved in Completed History Record
// -------------------------------------------------------------
const completedTourInHistory = historyManifest[0];
const totalExpenses = (completedTourInHistory.inTourExpenses || []).reduce((sum, e) => sum + e.amount, 0);
assert.strictEqual(totalExpenses, 55, "Logged expenses must be preserved ($40 + $15 = $55)");
console.log("  ✓ Test 5 Passed: Field expenses and claims preserved in completed history");

console.log("🎉 All Driver Journey Completion & History Archive tests passed successfully!");
