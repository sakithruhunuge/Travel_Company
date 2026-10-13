#!/usr/bin/env python3
"""
Test runner wrapper for pytest and unittest discovery.
Discovers and runs the privacy & data leakage guardrail tests defined in scripts/test_privacy_audit.py.
"""

import sys
import os

TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(TESTS_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from scripts.test_privacy_audit import PrivacyAuditGuardrailTests

if __name__ == "__main__":
    import unittest
    unittest.main()
