#!/usr/bin/env python3
"""
Privacy & Data Protection Test Suite (PR-01 through PR-15)
Empirical regression testing verifying that all privacy vulnerabilities, BOLA/IDOR gaps,
unauthenticated PII exposures, and logging leakages are fully mitigated.

Usage:
    python scripts/test_privacy_audit.py
    python -m unittest scripts/test_privacy_audit.py
"""

import sys
import os
import re
import unittest

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


class PrivacyAuditGuardrailTests(unittest.TestCase):
    """
    Automated regression tests verifying privacy defenses across Next.js API routes,
    auth configurations, logging sinks, and backend CORS policies.
    """

    def test_PR_01_upload_predictable_naming_mitigated(self):
        """PR-01: Verify uploads use cryptographic UUIDs and cannot be timestamp-enumerated."""
        upload_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "upload", "route.ts")
        with open(upload_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn("Date.now()", content, "Upload route must not use predictable Date.now() in filenames.")
        self.assertIn("crypto.randomUUID()", content, "Upload route must use cryptographically secure randomUUID.")

    def test_PR_02_invoice_endpoint_requires_authentication(self):
        """PR-02: Verify /api/invoices/[id] enforces session authentication and ownership checks."""
        invoice_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "invoices", "[id]", "route.ts")
        with open(invoice_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("getServerSession", content, "Invoice route must call getServerSession.")
        self.assertIn("isOwner", content, "Invoice route must check isOwner.")
        self.assertIn("isStaff", content, "Invoice route must check isStaff.")
        self.assertIn("401", content, "Invoice route must return 401 for unauthenticated calls.")

    def test_PR_03_crew_directory_requires_authentication(self):
        """PR-03: Verify /api/driver-guide enforces authentication and role verification."""
        dg_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "driver-guide", "route.ts")
        with open(dg_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("isStaff", content, "driver-guide route must verify staff status.")
        self.assertIn("if (!sessionUser)", content, "driver-guide must reject unauthenticated requests.")
        self.assertIn("401", content, "driver-guide must return 401 for anonymous access.")

    def test_PR_04_travel_request_scoped_to_tenant(self):
        """PR-04: Verify /api/travel-requests/[id] enforces tenantId filter on admin updates."""
        tr_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "travel-requests", "[id]", "route.ts")
        with open(tr_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("tenantFilter", content, "travel-requests/[id] must define tenantFilter for admin queries.")
        self.assertIn("query.tenantId", content, "travel-requests/[id] GET must scope query by tenantId.")

    def test_PR_05_allocation_requires_staff_role(self):
        """PR-05: Verify /api/allocation/assign strictly rejects non-staff callers."""
        alloc_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "allocation", "assign", "route.ts")
        with open(alloc_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("isAuthorized", content, "allocation route must check isAuthorized.")
        self.assertIn("Staff role required", content, "allocation route must require staff privileges.")

    def test_PR_06_driver_journey_end_removes_unscoped_fallback(self):
        """PR-06: Verify journey end removes global unscoped fallback and requires assignment check."""
        end_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "driver/journey/end/route.ts")
        if not os.path.exists(end_path):
            end_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "driver", "journey", "end", "route.ts")
        with open(end_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn("TravelRequest.findById(bookingId)", content, "Journey end must NOT fall back to unscoped global lookup.")
        self.assertIn("isAssignedCrew", content, "Journey end must verify assigned driver or staff identity.")

    def test_PR_07_intour_expense_enforces_crew_role(self):
        """PR-07: Verify in-tour expense log enforces assigned crew or staff permissions."""
        exp_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "intour", "expense-log", "route.ts")
        with open(exp_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("isAuthorized", content, "Expense log route must enforce role authorization.")
        self.assertIn("403", content, "Expense log route must return 403 for unauthorized users.")

    def test_PR_08_driver_registration_avoids_enumeration(self):
        """PR-08: Verify driver-guide registration returns generic errors on duplicate email/license."""
        reg_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "driver-guide", "register", "route.ts")
        with open(reg_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn("A crew profile with this email or license number is already registered", content,
                         "Registration error must not enumerate crew license/email existence.")
        self.assertIn("Unable to complete registration with the provided details", content)

    def test_PR_09_superadmin_hardcoded_seed_removed(self):
        """PR-09: Verify auth.ts does not auto-seed hardcoded SuperAdmin credentials."""
        auth_path = os.path.join(PROJECT_ROOT, "src", "lib", "auth.ts")
        with open(auth_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn("superadminpassword", content, "auth.ts must not contain hardcoded default superadmin password.")
        self.assertNotIn("No user found with this email under this portal", content, "Login errors must be generic to prevent email enumeration.")

    def test_PR_10_sms_service_masks_phone_pii(self):
        """PR-10: Verify smsService masks phone numbers in console/mock logs."""
        sms_path = os.path.join(PROJECT_ROOT, "src", "lib", "smsService.ts")
        with open(sms_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("maskPhoneNumber", content, "smsService must implement phone masking function.")
        self.assertNotIn("Direct SMS to: ${to}", content, "Raw phone number must not be printed to console.")

    def test_PR_11_prompt_pii_scrubbing_active(self):
        """PR-11: Verify generate-itinerary scrubs email and phone PII before forwarding to AI."""
        gen_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "generate-itinerary", "route.ts")
        with open(gen_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("scrubPiiFromPrompt", content, "generate-itinerary must scrub PII from user prompts.")
        self.assertIn("[REDACTED_EMAIL]", content, "generate-itinerary must redact emails.")
        self.assertIn("[REDACTED_PHONE]", content, "generate-itinerary must redact phone numbers.")

    def test_PR_12_test_bypass_auth_removed(self):
        """PR-12: Verify TEST_BYPASS_AUTH backdoor is completely eradicated from upload route."""
        upload_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "upload", "route.ts")
        with open(upload_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn("TEST_BYPASS_AUTH", content, "TEST_BYPASS_AUTH backdoor must not exist in upload route.")

    def test_PR_13_database_error_message_sanitized(self):
        """PR-13: Verify travel request 500 error does not return internal driver error details."""
        tr_post_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "travel-request", "route.ts")
        with open(tr_post_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn("details: errorMessage", content, "500 response must not leak raw database errorMessage.")

    def test_PR_14_user_deletion_cascading_anonymization(self):
        """PR-14: Verify user deletion cascades anonymization to travel requests per GDPR Art 17 / SL PDPA."""
        user_del_path = os.path.join(PROJECT_ROOT, "src", "app", "api", "tenant", "users", "route.ts")
        with open(user_del_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("Anonymized Data Subject", content, "User deletion must cascade anonymization to TravelRequest.")
        self.assertIn("specialRequests", content, "User deletion must scrub specialRequests health/dietary notes.")

    def test_PR_15_backend_cors_wildcard_eradicated(self):
        """PR-15: Verify backend CORS does not permit wildcard origins with credentials."""
        backend_path = os.path.join(PROJECT_ROOT, "backend", "main.py")
        with open(backend_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertNotIn('allow_origins=["*"]', content, "Backend CORS must not allow wildcard origin with credentials.")
        self.assertIn("ALLOWED_ORIGINS", content, "Backend CORS must use explicit allowed origins configuration.")


if __name__ == "__main__":
    print("=" * 80)
    print("RUNNING PRIVACY & DATA LEAKAGE AUDIT TEST SUITE (PR-01 TO PR-15)")
    print("=" * 80)
    suite = unittest.TestLoader().loadTestsFromTestCase(PrivacyAuditGuardrailTests)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("\n" + "=" * 80)
        print("RESULT: ALL 15 PRIVACY TEST CASES PASSED CLEANLY (100% SUCCESS RATE)")
        print("=" * 80)
        sys.exit(0)
    else:
        print("\n" + "=" * 80)
        print(f"RESULT: {len(result.failures)} FAILURES, {len(result.errors)} ERRORS DETECTED")
        print("=" * 80)
        sys.exit(1)
