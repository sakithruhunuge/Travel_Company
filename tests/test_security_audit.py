#!/usr/bin/env python3
"""
Test runner wrapper for pytest and unittest discovery.
Discovers and runs the security guardrail tests defined in scripts/test_security_audit.py.
"""

import sys
import os

# Include project root
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(TESTS_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from scripts.test_security_audit import SecurityAuditGuardrailTests

if __name__ == "__main__":
    import unittest
    unittest.main()
