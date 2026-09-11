import os
import sys
import json
import logging
import importlib
from typing import Union, Dict, Any, List

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

# Import Search Tool
try:
    search_mod = importlib.import_module("src.tools.search_tool")
    search_travel_database = search_mod.search_travel_database
except Exception as e:
    raise ImportError(f"Failed to import search_travel_database from src.tools.search_tool: {e}")

# Resilient Logger Import
try:
    logger_mod = importlib.import_module("src.utils.logger")
    logger = logger_mod.logger
except Exception:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    logger = logging.getLogger("retrieval_agent")


def execute_retrieval_agent(agent1_output: Union[Dict[str, Any], str]) -> str:
    """
    Agent 2: Multi-Destination Information Retrieval Searcher.
    Loops through ordered destinations from Agent 1, querying Database 1 for each city independently
    and applying budget-tier fallback logic per city.
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
    destinations = params.get("destinations")
    if not destinations or not isinstance(destinations, list):
        destinations = [params.get("destination", "Colombo")]

    budget_tier = params.get("budget_tier")
    vibe_query = params.get("vibe_query", "")
    selected_place_ids = params.get("selected_place_ids", [])
    duration_days = params.get("duration_days", 3)
    package_template = params.get("package_template")

    logger.info(f"Agent 2 querying database for destinations: {destinations}, budget='{budget_tier}', vibe='{vibe_query}'")

    search_results_by_destination: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    all_hotels: List[Dict[str, Any]] = []
    all_poi: List[Dict[str, Any]] = []
    any_fallback_triggered = False

    # 3. Query Database Per Destination in Order
    for dest in destinations:
        raw_search_json = search_travel_database(
            destination=dest,
            budget_tier=budget_tier,
            vibe_query=vibe_query,
            selected_place_ids=selected_place_ids,
            limit=5
        )

        try:
            city_search_data = json.loads(raw_search_json)
        except Exception as parse_err:
            logger.error(f"Error parsing search tool response for city '{dest}': {parse_err}")
            city_search_data = {"hotels": [], "poi": []}

        city_hotels = city_search_data.get("hotels", [])
        city_poi = city_search_data.get("poi", [])

        # Fallback Rule per City: If 0 hotels or 0 POIs returned for specified budget tier, broaden search
        if (len(city_hotels) == 0 or len(city_poi) == 0) and budget_tier is not None:
            logger.info(f"Fallback Rule Triggered for '{dest}': Yielded {len(city_hotels)} hotels, {len(city_poi)} POIs. Retrying with budget_tier=None...")
            any_fallback_triggered = True

            fallback_json = search_travel_database(
                destination=dest,
                budget_tier=None,
                vibe_query=vibe_query,
                selected_place_ids=selected_place_ids,
                limit=5
            )
            try:
                fb_data = json.loads(fallback_json)
                city_hotels = fb_data.get("hotels", [])
                city_poi = fb_data.get("poi", [])
            except Exception as fb_err:
                logger.error(f"Error parsing fallback search response for city '{dest}': {fb_err}")

        search_results_by_destination[dest] = {
            "hotels": city_hotels,
            "poi": city_poi
        }

        # Merge for backward-compatible flat structure
        for h in city_hotels:
            if h not in all_hotels:
                all_hotels.append(h)
        for p in city_poi:
            if p not in all_poi:
                all_poi.append(p)

    # 4. Package Results for Agent 3
    final_payload = {
        "destinations": destinations,
        "intake_params": {
            "destinations": destinations,
            "destination": destinations[0],
            "budget_tier": budget_tier,
            "vibe_query": vibe_query,
            "selected_place_ids": selected_place_ids,
            "duration_days": duration_days,
            "package_template": package_template
        },
        "search_results_by_destination": search_results_by_destination,
        "search_results": {
            "hotels": all_hotels,
            "poi": all_poi
        },
        "fallback_triggered": any_fallback_triggered
    }

    logger.info(f"Agent 2 completed retrieval across {len(destinations)} destinations: total {len(all_hotels)} hotels, {len(all_poi)} POIs. Fallback: {any_fallback_triggered}")
    return json.dumps(final_payload, indent=2, default=str)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Test Agent 2: Data Retrieval Searcher")
    parser.add_argument("--prompt", type=str, default="first i want to go galle and enjoy beach. then i want to go kandy.", help="User prompt")
    args = parser.parse_args()

    agent1_out = json.dumps({
        "destinations": ["Galle", "Kandy"],
        "destination": "Galle",
        "budget_tier": "Standard",
        "duration_days": 5,
        "vibe_query": args.prompt
    })

    print(execute_retrieval_agent(agent1_out))
