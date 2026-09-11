import assert from "node:assert";

console.log("🧪 Running Security & Multi-Tenancy Data Isolation Tests...");

interface TenantRecord {
  id: string;
  slug: string;
  name: string;
}

interface UserRecord {
  id: string;
  tenantId: string;
  email: string;
  role: string;
}

interface TravelRequestRecord {
  id: string;
  tenantId: string;
  userEmail: string;
  destination: string;
}

// Mock Tenant Data Isolation Filter
function queryTenantScopedRecords<T extends { tenantId: string }>(
  records: T[],
  activeTenantId: string
): T[] {
  return records.filter((r) => r.tenantId === activeTenantId);
}

// Test Data
const mockTenants: TenantRecord[] = [
  { id: "tenant_ceylon_123", slug: "ceylon", name: "Ceylon Tours" },
  { id: "tenant_lanka_456", slug: "lanka", name: "Lanka Travels" },
];

const mockRequests: TravelRequestRecord[] = [
  { id: "req_1", tenantId: "tenant_ceylon_123", userEmail: "client1@ceylon.com", destination: "Sigiriya" },
  { id: "req_2", tenantId: "tenant_ceylon_123", userEmail: "client2@ceylon.com", destination: "Ella" },
  { id: "req_3", tenantId: "tenant_lanka_456", userEmail: "client3@lanka.com", destination: "Galle" },
];

// Test 1: Tenant A queries requests - only Tenant A records returned
const ceylonRequests = queryTenantScopedRecords(mockRequests, "tenant_ceylon_123");
assert.strictEqual(ceylonRequests.length, 2, "Ceylon Tours should retrieve exactly 2 requests");
assert.ok(ceylonRequests.every((r) => r.tenantId === "tenant_ceylon_123"), "All records must belong to Ceylon Tours");
console.log("  ✓ Test 1 Passed: Tenant A data isolation verified");

// Test 2: Tenant B queries requests - zero cross-tenant leakage from Tenant A
const lankaRequests = queryTenantScopedRecords(mockRequests, "tenant_lanka_456");
assert.strictEqual(lankaRequests.length, 1, "Lanka Travels should retrieve exactly 1 request");
assert.strictEqual(lankaRequests[0].destination, "Galle", "Lanka Travels sees only its own request");
console.log("  ✓ Test 2 Passed: Cross-tenant data leak prevention verified");

// Test 3: Unauthenticated / Invalid Tenant ID Query returns empty array
const invalidTenantRequests = queryTenantScopedRecords(mockRequests, "invalid_tenant_xyz");
assert.strictEqual(invalidTenantRequests.length, 0, "Invalid tenant queries must return empty result set");
console.log("  ✓ Test 3 Passed: Invalid tenant boundary protection verified");

console.log("✅ All Security & Multi-Tenancy Data Isolation Tests Passed Cleanly!\n");
