import os
import sys
import json
import importlib
from typing import Union, Dict, Any, Optional

# --------------------------------------------------------------------------
# 1. DYNAMIC SYS.PATH & VENV SITE-PACKAGES RESOLUTION
# --------------------------------------------------------------------------
curr_file_dir = os.path.dirname(os.path.abspath(__file__))
temp_dir = curr_file_dir

etl_dir = None
site_pkg_dir = None

for _ in range(6):
    cand_etl1 = os.path.join(temp_dir, "Web scraper", "web_scraper", "srilanka-travel-etl")
    cand_etl2 = os.path.join(temp_dir, "web_scraper", "srilanka-travel-etl")
    cand_etl3 = os.path.join(temp_dir, "srilanka-travel-etl")
    
    cand_site1 = os.path.join(cand_etl1, "venv", "Lib", "site-packages")
    cand_site2 = os.path.join(cand_etl2, "venv", "Lib", "site-packages")
    cand_site3 = os.path.join(cand_etl3, "venv", "Lib", "site-packages")

    if os.path.exists(cand_etl1):
        etl_dir = cand_etl1
        if os.path.exists(cand_site1):
            site_pkg_dir = cand_site1
        break
    elif os.path.exists(cand_etl2):
        etl_dir = cand_etl2
        if os.path.exists(cand_site2):
            site_pkg_dir = cand_site2
        break
    elif os.path.exists(cand_etl3):
        etl_dir = cand_etl3
        if os.path.exists(cand_site3):
            site_pkg_dir = cand_site3
        break

    parent = os.path.dirname(temp_dir)
    if parent == temp_dir:
        break
    temp_dir = parent

if site_pkg_dir and site_pkg_dir not in sys.path:
    sys.path.insert(0, site_pkg_dir)

if etl_dir and etl_dir not in sys.path:
    sys.path.insert(0, etl_dir)

proj_root = os.path.dirname(os.path.dirname(curr_file_dir))
if proj_root not in sys.path:
    sys.path.append(proj_root)

# Resilient Logger Import
try:
    logger_mod = importlib.import_module("src.utils.logger")
    logger = logger_mod.logger
except Exception:
    import logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    logger = logging.getLogger("retrieval_agent")

# Dynamic Search Tool Import
try:
    search_mod = importlib.import_module("src.tools.search_tool")
    search_travel_database = search_mod.search_travel_database
except Exception as e:
    logger.error(f"Failed to import search_travel_database: {e}")
    def search_travel_database(**kwargs):
        return json.dumps({"error": "Search tool unavailable", "hotels": [], "poi": []})


def execute_retrieval_agent(agent1_output: Union[Dict[str, Any], str]) -> str:
    """
    Agent 2: Data Retrieval Searcher.
    Receives structured intake payload from Agent 1, invokes search_travel_database over SCRAPER_DB,
    applies intelligent budget-tier fallbacks if results are empty, and packages data for Agent 3.

    Parameters:
        agent1_output (Dict or str): Output from Agent 1 (JSON string or dictionary).

    Returns:
        str: Consolidated raw JSON string ready for Agent 3.
    """
    logger.info("Executing Agent 2: Data Retrieval Searcher...")

    # 1. Parse Agent 1 Payload
    if isinstance(agent1_output, str):
        try:
            params = json.loads(agent1_output)
        except Exception as err:
            logger.error(f"Failed to parse Agent 1 JSON string payload: {err}")
            return json.dumps({"error": "Invalid Agent 1 output format."}, indent=2)
    elif isinstance(agent1_output, dict):
        params = agent1_output
    else:
        logger.error("Invalid input type provided to Agent 2.")
        return json.dumps({"error": "Invalid Agent 1 output format."}, indent=2)

    # Propagate error if Agent 1 flagged security violation or invalid input
    if "error" in params:
        logger.warning(f"Propagating Agent 1 error: {params.get('error')}")
        return json.dumps(params, indent=2)

    # 2. Extract Travel Parameters
    destination = params.get("destination", "Colombo")
    budget_tier = params.get("budget_tier")
    vibe_query = params.get("vibe_query", "")
    selected_place_ids = params.get("selected_place_ids", [])
    duration_days = params.get("duration_days", 3)
    package_template = params.get("package_template")

    logger.info(f"Agent 2 querying database: destination='{destination}', budget='{budget_tier}', vibe='{vibe_query}'")

    # 3. Execute Initial Search
    raw_search_json = search_travel_database(
        destination=destination,
        budget_tier=budget_tier,
        vibe_query=vibe_query,
        selected_place_ids=selected_place_ids,
        limit=5
    )

    try:
        search_data = json.loads(raw_search_json)
    except Exception as parse_err:
        logger.error(f"Error parsing search tool response: {parse_err}")
        search_data = {"hotels": [], "poi": []}

    hotels = search_data.get("hotels", [])
    poi = search_data.get("poi", [])
    fallback_triggered = False

    # 4. Fallback Rule Execution: If no hotels or no POIs matched and budget_tier was specified, broaden search
    if (len(hotels) == 0 or len(poi) == 0) and budget_tier is not None:
        logger.info(f"Fallback Rule Triggered: Initial search yielded {len(hotels)} hotels and {len(poi)} POIs for budget '{budget_tier}'. Retrying with budget_tier=None...")
        fallback_triggered = True
        
        fallback_search_json = search_travel_database(
            destination=destination,
            budget_tier=None,
            vibe_query=vibe_query,
            selected_place_ids=selected_place_ids,
            limit=5
        )
        try:
            search_data = json.loads(fallback_search_json)
        except Exception as fb_err:
            logger.error(f"Error parsing fallback search response: {fb_err}")

    # 5. Package Results for Agent 3
    final_payload = {
        "intake_params": {
            "destination": destination,
            "budget_tier": budget_tier,
            "vibe_query": vibe_query,
            "selected_place_ids": selected_place_ids,
            "duration_days": duration_days,
            "package_template": package_template
        },
        "search_results": search_data,
        "fallback_triggered": fallback_triggered
    }

    logger.info(f"Agent 2 completed retrieval: {len(search_data.get('hotels', []))} hotels, {len(search_data.get('poi', []))} POIs. Fallback: {fallback_triggered}")
    return json.dumps(final_payload, indent=2, default=str)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Test Agent 2: Data Retrieval Searcher")
    parser.add_argument("--destination", type=str, default="Galle", help="Target city")
    parser.add_argument("--budget", type=str, default="Standard", help="Budget tier")
    parser.add_argument("--vibe", type=str, default="quiet beach fort seafood", help="Vibe query")
    args = parser.parse_args()

    dummy_agent1_output = json.dumps({
        "destination": args.destination,
        "budget_tier": args.budget,
        "vibe_query": args.vibe,
        "selected_place_ids": [],
        "duration_days": 4,
        "package_template": None
    })

    result = execute_retrieval_agent(dummy_agent1_output)
    print(result)
