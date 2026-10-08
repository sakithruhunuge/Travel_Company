import assert from "node:assert";

console.log("🧪 Running Unit Tests: Tour Lifecycle & Financial Reconciliation Engine...");

// -------------------------------------------------------------
// Test 1: Proforma Invoice Mathematical Model & Forex Buffering
// -------------------------------------------------------------
function calculateProforma({
  hotelCharges,
  vehicleCharges,
  driverGuideCharges,
  excursionCharges,
  forexBufferPercent = 2.5,
  depositPercent = 30,
}: {
  hotelCharges: number;
  vehicleCharges: number;
  driverGuideCharges: number;
  excursionCharges: number;
  forexBufferPercent?: number;
  depositPercent?: number;
}) {
  const subtotal = hotelCharges + vehicleCharges + driverGuideCharges + excursionCharges;
  const forexBuffer = (subtotal * forexBufferPercent) / 100;
  const totalAmount = Math.round(subtotal + forexBuffer);
  const advanceDepositDue = Math.round((totalAmount * depositPercent) / 100);
  return { subtotal, forexBuffer, totalAmount, advanceDepositDue };
}

const proforma1 = calculateProforma({
  hotelCharges: 800,
  vehicleCharges: 600,
  driverGuideCharges: 250,
  excursionCharges: 150,
  forexBufferPercent: 2.5,
  depositPercent: 30,
});

assert.strictEqual(proforma1.subtotal, 1800, "Subtotal must be 1800");
assert.strictEqual(proforma1.forexBuffer, 45, "2.5% forex buffer on 1800 must be 45");
assert.strictEqual(proforma1.totalAmount, 1845, "Total amount must be 1845");
assert.strictEqual(proforma1.advanceDepositDue, 554, "30% advance deposit on 1845 must round to 554");
console.log("  ✓ Test 1 Passed: Proforma cost breakdown & forex risk buffer calculation verified");

// -------------------------------------------------------------
// Test 2: In-Tour Dynamic Additions Accumulation
// -------------------------------------------------------------
interface InTourItem {
  category: string;
  description: string;
  amount: number;
}

function sumInTourAdditions(items: InTourItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

const fieldAdditions: InTourItem[] = [
  { category: "ticket", description: "2x Whale Watching tickets at Mirissa", amount: 80 },
  { category: "extra_mileage", description: "Extra 45km detour to Nuwara Eliya tea factory", amount: 35 },
  { category: "hotel_upgrade", description: "Upgrade to Deluxe Ocean Suite in Bentota", amount: 120 },
];

const totalAdditions = sumInTourAdditions(fieldAdditions);
assert.strictEqual(totalAdditions, 235, "Total field additions must equal 235");
console.log("  ✓ Test 2 Passed: In-tour dynamic additions ledger accumulation verified");

// -------------------------------------------------------------
// Test 3: Actual Invoice Reconciliation - Scenario A (Higher Cost)
// -------------------------------------------------------------
function reconcileActualInvoice({
  proformaBaseTotal,
  additionsTotal,
  deductionsTotal,
  advanceDepositPaid,
}: {
  proformaBaseTotal: number;
  additionsTotal: number;
  deductionsTotal: number;
  advanceDepositPaid: number;
}) {
  const netFinalTotal = Math.round(proformaBaseTotal + additionsTotal - deductionsTotal);
  const balanceDue = Math.max(0, netFinalTotal - advanceDepositPaid);
  const refundDue = Math.max(0, advanceDepositPaid - netFinalTotal);
  return { netFinalTotal, balanceDue, refundDue };
}

// Guest added excursions and extra mileage -> Actual > Proforma
const actualScenarioA = reconcileActualInvoice({
  proformaBaseTotal: 1845,
  additionsTotal: 235,
  deductionsTotal: 0,
  advanceDepositPaid: 554, // Guest paid 30% advance deposit earlier
});

assert.strictEqual(actualScenarioA.netFinalTotal, 2080, "Net final total must be 1845 + 235 = 2080");
assert.strictEqual(actualScenarioA.balanceDue, 1526, "Balance due must be 2080 - 554 = 1526");
assert.strictEqual(actualScenarioA.refundDue, 0, "Refund due must be 0 in higher cost scenario");
console.log("  ✓ Test 3 Passed: Actual Invoice Scenario A (Higher Cost / Additions Balance Due) verified");

// -------------------------------------------------------------
// Test 4: Actual Invoice Reconciliation - Scenario B (Lower Cost / Refund Due)
// -------------------------------------------------------------
// Guest paid full tour in advance, but left 2 days early ($400 hotel credit + $100 unused tickets)
const actualScenarioB = reconcileActualInvoice({
  proformaBaseTotal: 1845,
  additionsTotal: 0,
  deductionsTotal: 500, // Early checkout & unused tickets
  advanceDepositPaid: 1845, // Full tour prepaid
});

assert.strictEqual(actualScenarioB.netFinalTotal, 1345, "Net final total must be 1845 - 500 = 1345");
assert.strictEqual(actualScenarioB.balanceDue, 0, "Balance due must be 0 when advance exceeds actual");
assert.strictEqual(actualScenarioB.refundDue, 500, "Refund credit due must be 500");
console.log("  ✓ Test 4 Passed: Actual Invoice Scenario B (Lower Cost / Early Checkout Refund) verified");

// -------------------------------------------------------------
// Test 5: System Tour ID Sequence Format Validation
// -------------------------------------------------------------
function generateTourIdMock(date = new Date(), seq = 42): string {
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const suffix = String(seq).padStart(4, "0");
  return `TRV-${yearMonth}-${suffix}`;
}

const tourId = generateTourIdMock(new Date("2026-09-10T12:00:00Z"), 142);
const tourIdRegex = /^TRV-\d{6}-\d{4}$/;
assert.ok(tourIdRegex.test(tourId), `Tour ID '${tourId}' must conform to TRV-YYYYMM-XXXX regex`);
assert.strictEqual(tourId, "TRV-202609-0142");
console.log("  ✓ Test 5 Passed: Tour ID sequence format regex & formatting verified");

// -------------------------------------------------------------
// Test 6: Legal State Machine Progression
// -------------------------------------------------------------
const validTransitions: Record<string, string[]> = {
  pending: ["quoted", "confirmed", "rejected"],
  quoted: ["confirmed", "rejected", "cancelled"],
  confirmed: ["allocated", "cancelled"],
  allocated: ["proforma_issued", "active_tour", "cancelled"],
  proforma_issued: ["active_tour", "cancelled"],
  active_tour: ["reconciling", "completed"],
  reconciling: ["completed"],
  completed: [],
  rejected: [],
  cancelled: [],
};

function isValidStateTransition(fromState: string, toState: string): boolean {
  return (validTransitions[fromState] || []).includes(toState);
}

assert.ok(isValidStateTransition("pending", "quoted"), "pending -> quoted must be valid");
assert.ok(isValidStateTransition("quoted", "confirmed"), "quoted -> confirmed must be valid");
assert.ok(isValidStateTransition("confirmed", "allocated"), "confirmed -> allocated must be valid");
assert.ok(isValidStateTransition("allocated", "proforma_issued"), "allocated -> proforma_issued must be valid");
assert.ok(isValidStateTransition("proforma_issued", "active_tour"), "proforma_issued -> active_tour must be valid");
assert.ok(isValidStateTransition("active_tour", "completed"), "active_tour -> completed must be valid");
assert.strictEqual(isValidStateTransition("pending", "completed"), false, "Illegal leap pending -> completed must fail");

console.log("  ✓ Test 6 Passed: State machine lifecycle transitions & guard validations verified");

console.log("\n🎉 All 6 Tour Lifecycle & Financial Reconciliation Unit Tests Passed Cleanly!\n");
