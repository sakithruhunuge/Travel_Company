import assert from "node:assert";

console.log("🧪 Running Driver & Tour Guide Freelance Onboarding & Approval Workflow Tests...\n");

interface MockUser {
  id: string;
  email: string;
  role: string;
  status: "pending" | "active" | "suspended";
}

interface MockDriverGuide {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "driver" | "tour_guide" | "both";
  licenseNumber: string;
  employmentType: "permanent" | "freelance";
  approvalStatus: "pending" | "approved" | "rejected";
  status: "available" | "on_tour" | "off_duty";
  vehicleDetails?: { plateNumber: string; model: string; category: string };
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

// Simulated Registration Service
function registerFreelancer(payload: {
  name: string;
  email: string;
  phone: string;
  role: "driver" | "tour_guide" | "both";
  licenseNumber: string;
  vehicleDetails?: { plateNumber: string; model: string; category: string };
  registrationMode: "public" | "invite_only" | "disabled";
}): { user: MockUser; crew: MockDriverGuide } {
  if (payload.registrationMode === "disabled") {
    throw new Error("Partner registration is currently closed");
  }
  if (!payload.name || !payload.email || !payload.licenseNumber) {
    throw new Error("Required fields missing");
  }
  if ((payload.role === "driver" || payload.role === "both") && !payload.vehicleDetails?.plateNumber) {
    throw new Error("Vehicle plate number is required for driver applications");
  }

  const userId = `usr_${Date.now()}`;
  const user: MockUser = {
    id: userId,
    email: payload.email,
    role: payload.role === "both" ? "driver" : payload.role,
    status: "pending", // Accounts start pending admin approval
  };

  const crew: MockDriverGuide = {
    id: `crew_${Date.now()}`,
    userId,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    licenseNumber: payload.licenseNumber,
    employmentType: "freelance",
    approvalStatus: "pending",
    status: "off_duty",
    vehicleDetails: payload.vehicleDetails,
  };

  return { user, crew };
}

// Simulated Review Service (Marketing Officer / Admin)
function reviewApplicant(
  crew: MockDriverGuide,
  user: MockUser,
  reviewerId: string,
  reviewerRole: string,
  action: "approve" | "reject",
  rejectionReason?: string
): { crew: MockDriverGuide; user: MockUser } {
  const isAuthorized = ["tenant_admin", "marketing_officer", "super_admin"].includes(reviewerRole);
  if (!isAuthorized) {
    throw new Error("Access Denied: Marketing Officer or Admin privileges required");
  }

  if (action === "approve") {
    crew.approvalStatus = "approved";
    crew.status = "available";
    crew.reviewedBy = reviewerId;
    crew.reviewedAt = new Date();
    user.status = "active";
  } else {
    crew.approvalStatus = "rejected";
    crew.rejectionReason = rejectionReason || "Application requirements not met";
    crew.reviewedBy = reviewerId;
    crew.reviewedAt = new Date();
    user.status = "suspended";
  }

  return { crew, user };
}

// Simulated Auth Login Check
function canUserLogin(user: MockUser): { allowed: boolean; error?: string } {
  if (user.status === "pending") {
    return { allowed: false, error: "Your account is pending activation" };
  }
  if (user.status === "suspended") {
    return { allowed: false, error: "Your account has been suspended" };
  }
  return { allowed: true };
}

// ------------------- TEST EXECUTION -------------------

// Test 1: Freelance driver registration validation
console.log("Test 1: Validating freelance registration rules...");
assert.throws(
  () =>
    registerFreelancer({
      name: "Kasun Bandara",
      email: "kasun@driver.lk",
      phone: "+94 77 111 2222",
      role: "driver",
      licenseNumber: "DRV-1234",
      // missing vehicleDetails
      registrationMode: "invite_only",
    }),
  /Vehicle plate number is required/,
  "Driver registration must require vehicle details"
);
console.log("  ✓ Test 1 Passed: Driver vehicle validation enforced");

// Test 2: Successful Freelancer Application creates Pending status
console.log("\nTest 2: Successful registration initializes pending approval...");
const regResult = registerFreelancer({
  name: "Kasun Bandara",
  email: "kasun@driver.lk",
  phone: "+94 77 111 2222",
  role: "driver",
  licenseNumber: "DRV-1234",
  vehicleDetails: { plateNumber: "WP-KX-9901", model: "Toyota KDH", category: "Van" },
  registrationMode: "public",
});

assert.strictEqual(regResult.user.status, "pending", "User must start in 'pending' status");
assert.strictEqual(regResult.crew.approvalStatus, "pending", "Crew profile must start in 'pending' approvalStatus");
assert.strictEqual(regResult.crew.employmentType, "freelance", "Must be flagged as freelance");
console.log("  ✓ Test 2 Passed: New freelancer correctly placed in pending approval queue");

// Test 3: Unapproved Freelancers cannot log in
console.log("\nTest 3: Authentication guard blocks unapproved pending accounts...");
const loginAttempt1 = canUserLogin(regResult.user);
assert.strictEqual(loginAttempt1.allowed, false, "Pending user must not be allowed to log in");
assert.strictEqual(loginAttempt1.error, "Your account is pending activation");
console.log("  ✓ Test 3 Passed: Login prevented prior to marketing manager approval");

// Test 4: Marketing Officer approves applicant
console.log("\nTest 4: Marketing Officer reviews and approves applicant...");
const approved = reviewApplicant(
  regResult.crew,
  regResult.user,
  "mkt_officer_01",
  "marketing_officer",
  "approve"
);

assert.strictEqual(approved.crew.approvalStatus, "approved", "Crew approval status must be 'approved'");
assert.strictEqual(approved.crew.status, "available", "Approved driver must be 'available' for tours");
assert.strictEqual(approved.user.status, "active", "Linked User account must be activated");
assert.strictEqual(approved.crew.reviewedBy, "mkt_officer_01", "Audit reviewer recorded");

// Now check if login works
const loginAttempt2 = canUserLogin(approved.user);
assert.strictEqual(loginAttempt2.allowed, true, "Approved user can now authenticate");
console.log("  ✓ Test 4 Passed: Marketing Officer approval successfully activates driver login");

// Test 5: Rejection workflow with feedback note
console.log("\nTest 5: Rejection sets rejected status and feedback reason...");
const guideResult = registerFreelancer({
  name: "Ruwan Silva",
  email: "ruwan@guide.lk",
  phone: "+94 71 333 4444",
  role: "tour_guide",
  licenseNumber: "GUI-5555",
  registrationMode: "invite_only",
});

const rejected = reviewApplicant(
  guideResult.crew,
  guideResult.user,
  "mkt_officer_01",
  "marketing_officer",
  "reject",
  "SLTDA accreditation document expired"
);

assert.strictEqual(rejected.crew.approvalStatus, "rejected");
assert.strictEqual(rejected.crew.rejectionReason, "SLTDA accreditation document expired");
assert.strictEqual(rejected.user.status, "suspended");
console.log("  ✓ Test 5 Passed: Applicant rejection and feedback notes correctly tracked");

// Test 6: Closed registration mode prevents submissions
console.log("\nTest 6: Closed registration mode check...");
assert.throws(
  () =>
    registerFreelancer({
      name: "New Applicant",
      email: "new@crew.lk",
      phone: "+94 77 000 0000",
      role: "tour_guide",
      licenseNumber: "GUI-9999",
      registrationMode: "disabled",
    }),
  /Partner registration is currently closed/,
  "Must block registrations when mode is disabled"
);
console.log("  ✓ Test 6 Passed: Tenant registration toggle honored");

console.log("\n🎉 All 6 Driver & Guide Freelance Onboarding & Approval Tests Passed Successfully!\n");
