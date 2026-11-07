#!/usr/bin/env python3
"""
Master Prompt 3: Responsible AI, Bias, Fairness & Trustworthiness Test Suite (RA-01 through RA-16)
Mirror located in tests/ directory for standard test discovery.
"""

import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from scripts.test_responsible_ai_audit import ResponsibleAIAuditGuardrailTests

if __name__ == "__main__":
    import unittest
    unittest.main()
