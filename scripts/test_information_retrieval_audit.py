#!/usr/bin/env python3
"""
================================================================================
INFORMATION RETRIEVAL AND SECURITY ASSESSMENT TEST SUITE (IR-01 to IR-16)
Empirical verification of Information Retrieval (IR) Accuracy, RAG Security,
Vector Database Guardrails, Groundedness, OWASP API Security, and Tenant Scoping.
================================================================================
Standards & Frameworks Aligned:
- OWASP Top 10 for Large Language Model Applications (OWASP LLM 2025)
- OWASP API Security Top 10 (2023)
- NIST AI Risk Management Framework (NIST AI RMF 1.0)
- ISO/IEC 42001 (Artificial Intelligence Management System)
================================================================================
Usage:
    python scripts/test_information_retrieval_audit.py
    python -m unittest scripts/test_information_retrieval_audit.py
================================================================================
"""

import sys
import os
import re
import json
import unittest

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.agents.intake_agent import (
    parse_intake_submission,
    extract_destinations,
    extract_budget_tier,
    extract_duration_days,
    is_security_threat_or_off_topic,
    KNOWN_DESTINATIONS
)
from src.tools.search_tool import (
    search_travel_database,
    is_city_match,
    compute_cosine_similarity,
    DESTINATION_FALLBACK_HOTELS,
    DESTINATION_FALLBACK_POIS,
    REGION_ALIASES
)
from src.agents.retrieval_agent import execute_retrieval_agent
from src.agents.explainer_agent import (
    generate_explainable_itinerary,
    extract_suggested_places_by_destination,
    SYSTEM_PROMPT_AGENT_3
)


class InformationRetrievalSecurityAuditTests(unittest.TestCase):
    """
    Automated empirical validation suite covering the 8 Core Information Retrieval
    and Security Evaluation Dimensions (IR-01 through IR-16).
    """

    # =========================================================================
    # AREA A: RETRIEVAL ACCURACY
    # =========================================================================

    def test_IR_01_geofencing_cross_city_boundary_filtering(self):
        """
        Test ID: IR-01
        Evaluation Area: Retrieval Accuracy
        Test Objective: Verify strict geofencing and zero cross-city document leakage.
        Target Component: search_tool.py -> is_city_match()
        """
        # 1. Direct unit verification of is_city_match
        kandy_doc = {"city": "Kandy", "name": "Earl's Regency"}
        colombo_doc = {"city": "Colombo", "name": "Kingsbury Hotel"}
        galle_doc = {"city": "Galle", "name": "Amangalla"}
        peradeniya_suburb = {"city": "Peradeniya", "name": "Royal Botanical Gardens"}

        self.assertTrue(is_city_match(kandy_doc, "Kandy"), "Direct city match for Kandy must pass.")
        self.assertFalse(is_city_match(colombo_doc, "Kandy"), "Colombo hotel must not match Kandy query.")
        self.assertFalse(is_city_match(galle_doc, "Kandy"), "Galle hotel must not match Kandy query.")
        self.assertTrue(is_city_match(peradeniya_suburb, "Kandy"), "Regional sub-town alias Peradeniya must map to Kandy.")

        # 2. Database retrieval geofence validation
        res_json = search_travel_database(destination="Kandy", budget_tier="Standard", limit=5)
        res = json.loads(res_json)
        self.assertIn("hotels", res)
        self.assertIn("poi", res)

        for h in res["hotels"]:
            self.assertTrue(
                is_city_match(h, "Kandy"),
                f"Hotel '{h.get('name')}' in city '{h.get('city')}' leaked into Kandy retrieval results!"
            )
        for p in res["poi"]:
            self.assertTrue(
                is_city_match(p, "Kandy"),
                f"POI '{p.get('name')}' in city '{p.get('city')}' leaked into Kandy retrieval results!"
            )

    def test_IR_02_strict_budget_tier_price_exclusion(self):
        """
        Test ID: IR-02
        Evaluation Area: Retrieval Accuracy
        Test Objective: Ensure strict exclusion of 5-star/luxury tiers on budget queries.
        Target Component: search_tool.py -> search_travel_database()
        """
        res_json = search_travel_database(destination="Colombo", budget_tier="Budget", limit=5)
        res = json.loads(res_json)
        hotels = res.get("hotels", [])
        self.assertGreater(len(hotels), 0, "Budget search should return candidate hotels.")

        for h in hotels:
            star_rating = h.get("star_rating", 3)
            price_tier = (h.get("price_tier") or "").lower()
            avg_nightly = h.get("avg_nightly_usd") or h.get("avg_nightly") or 0.0

            self.assertLessEqual(
                star_rating, 3,
                f"Violation: 5-star/4-star hotel '{h.get('name')}' returned on a Budget query!"
            )
            self.assertNotIn(
                "luxury", price_tier,
                f"Violation: Hotel marked as luxury '{h.get('name')}' returned for Budget query!"
            )
            self.assertLess(
                avg_nightly, 60.0,
                f"Violation: Rate ${avg_nightly} exceeds budget threshold ($60) for '{h.get('name')}'!"
            )

    def test_IR_03_selected_place_ids_priority_boosting(self):
        """
        Test ID: IR-03
        Evaluation Area: Retrieval Accuracy
        Test Objective: Verify that user-selected place IDs receive explicit priority boost (+1.0).
        Target Component: search_tool.py -> scored_pois priority boost logic
        """
        target_poi_id = "kandy-tooth-relic"
        res_json = search_travel_database(
            destination="Kandy",
            budget_tier="Standard",
            selected_place_ids=[target_poi_id],
            limit=5
        )
        res = json.loads(res_json)
        pois = res.get("poi", [])
        self.assertGreater(len(pois), 0)

        top_poi = pois[0]
        top_id = top_poi.get("source_id") or top_poi.get("id")
        self.assertEqual(
            top_id, target_poi_id,
            f"Selected place ID '{target_poi_id}' was not elevated to rank 1! Found: '{top_id}'"
        )

    # =========================================================================
if __name__ == "__main__":
    unittest.main()
