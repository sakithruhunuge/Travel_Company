import os
import sys
import json
import logging
import importlib
from typing import Dict, Any, List, Union

# --------------------------------------------------------------------------
# DYNAMIC SYS.PATH & VENV SITE-PACKAGES RESOLUTION
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

import requests

try:
    logger_mod = importlib.import_module("src.utils.logger")
    logger = logger_mod.logger
except Exception:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    logger = logging.getLogger("explainer_agent")

SYSTEM_PROMPT_AGENT_3 = """You are Agent 3: The Expert Sri Lanka Travel Guide and Explainable AI (XAI) Itinerary Designer.
Your job is to read the structured retrieval JSON data provided by Agent 2 (which contains hotels and points of interest for Sri Lanka grouped by destination) and generate a compelling, beautiful, day-by-day Markdown travel itinerary.

CRITICAL INSTRUCTIONS:
1. When destinations has more than one entry, the itinerary MUST be sectioned by destination in the exact given order with explicit day ranges per city (e.g. ## 📍 Galle (Days 1–3), ## 📍 Kandy (Days 4–5)).
2. Every hotel, resort, attraction, or landmark mentioned MUST include an explicit Explainable AI callout block in this EXACT format:
   💡 Why This Was Chosen: [Clear explanation of why this place matches the traveler's budget, vibe, or location preference]
3. Make the markdown format clean, well-formatted, with bold titles, emojis, and cost/rating highlights.
4. Ensure tone is hospitable, enthusiastic, and authentic to Sri Lanka.
"""


def allocate_days_per_destination(duration_days: int, destinations: List[str]) -> tuple[List[str], Dict[str, tuple[int, int]], bool]:
    """
    Allocates days near-evenly across ordered destinations, front-loading remainder days.
    If duration_days < len(destinations), trims destination list to fit duration_days.
    Returns: (effective_destinations, day_ranges_map, is_trimmed)
    """
    if not destinations:
        destinations = ["Colombo"]
    
    is_trimmed = False
    effective_dests = list(destinations)

    if duration_days < len(effective_dests):
        effective_dests = effective_dests[:duration_days]
        is_trimmed = True

    n = len(effective_dests)
    base = duration_days // n
    rem = duration_days % n

    day_ranges: Dict[str, tuple[int, int]] = {}
    current_day = 1

    for i, dest in enumerate(effective_dests):
        # Front-load remainder days to earlier destinations
        city_days = base + (1 if i < rem else 0)
        end_day = current_day + city_days - 1
        day_ranges[dest] = (current_day, end_day)
        current_day = end_day + 1

    return effective_dests, day_ranges, is_trimmed


def extract_suggested_places_by_destination(agent2_data: Dict[str, Any]) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
    """
    Assembles selectable suggested hotels and POIs for the frontend cards with real scraped prices.
    """
    intake = agent2_data.get("intake_params", {})
    destinations = agent2_data.get("destinations") or intake.get("destinations") or [intake.get("destination", "Colombo")]
    by_dest = agent2_data.get("search_results_by_destination", {})
    budget = intake.get("budget_tier", "Standard")

    result: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}

    for dest in destinations:
        city_data = by_dest.get(dest, {})
        city_hotels = city_data.get("hotels", [])
        city_poi = city_data.get("poi", [])

        formatted_hotels = []
        for h in city_hotels[:3]:
            rate = h.get("avg_nightly_usd") or h.get("avg_nightly") or h.get("price_per_night")
            if not rate:
                rate = 120 if budget == "Luxury" else 35 if budget == "Budget" else 65
            
            raw_rating = h.get("rating")
            rating_val = float(raw_rating) if raw_rating is not None else 4.5

            formatted_hotels.append({
                "id": str(h.get("id") or h.get("_id") or h.get("name")),
                "name": h.get("name", "Boutique Hotel"),
                "city": h.get("city", dest),
                "avg_nightly_usd": float(rate),
                "rating": rating_val,
                "price_tier": h.get("price_tier", budget),
                "description": h.get("description", "Recommended accommodation in Sri Lanka.")
            })

        formatted_poi = []
        for p in city_poi[:5]:
            ticket = p.get("ticket_price_usd") or p.get("entry_fee") or 0.0
            raw_p_rating = p.get("rating")
            p_rating_val = float(raw_p_rating) if raw_p_rating is not None else 4.7

            formatted_poi.append({
                "id": str(p.get("id") or p.get("_id") or p.get("name")),
                "name": p.get("name", "Cultural Landmark"),
                "city": p.get("city", dest),
                "ticket_price_usd": float(ticket),
                "rating": p_rating_val,
                "categories": p.get("categories", []),
                "description": p.get("description", "Attraction landmark in Sri Lanka.")
            })

        result[dest] = {
            "hotels": formatted_hotels,
            "poi": formatted_poi
        }

    return result


def generate_deterministic_markdown_itinerary(agent2_data: Dict[str, Any]) -> str:
    """
    Fallback XAI Itinerary Builder: Sectioned multi-destination Markdown itinerary
    with explicit Explainable AI callout blocks ('💡 Why This Was Chosen:') per destination.
    """
    intake = agent2_data.get("intake_params", {})
    destinations = agent2_data.get("destinations") or intake.get("destinations") or [intake.get("destination", "Colombo")]
    by_dest = agent2_data.get("search_results_by_destination", {})
    budget = intake.get("budget_tier", "Standard")
    duration = intake.get("duration_days", 3)
    vibe = intake.get("vibe_query", "Sri Lanka Tour")

    effective_dests, day_ranges, is_trimmed = allocate_days_per_destination(duration, destinations)
    dest_str = " → ".join(effective_dests)

    lines = []
    lines.append(f"# 🌴 {duration}-Day Sri Lanka Travel Itinerary: {dest_str}")
    lines.append(f"**Target Route:** {dest_str} | **Budget Tier:** {budget} | **Duration:** {duration} Days")
    lines.append(f"**Vibe & Intent:** *\"{vibe}\"*")

    if is_trimmed:
        lines.append(f"\n> 💡 **Note:** Trimmed to fit your {duration}-day duration — add more days to include everywhere you mentioned.")

    lines.append("\n---")

    # Loop per destination block
    for dest in effective_dests:
        start_d, end_d = day_ranges[dest]
        day_label = f"Day {start_d}" if start_d == end_d else f"Days {start_d}–{end_d}"
        
        lines.append(f"\n\n# 📍 Destination: {dest} ({day_label})")
        
        city_data = by_dest.get(dest, {})
        city_hotels = city_data.get("hotels", [])
        city_poi = city_data.get("poi", [])

        # Hotel section for this city
        lines.append(f"\n## 🏨 Featured Accommodation in {dest}")
        if city_hotels:
            for idx, h in enumerate(city_hotels[:2]):
                h_name = h.get("name", f"{dest} Boutique Resort")
                h_rating = h.get("rating", 4.8)
                h_price = h.get("avg_nightly_usd") or h.get("avg_nightly") or (120 if budget == "Luxury" else 35 if budget == "Budget" else 65)
                h_desc = h.get("description", f"Comfortable accommodation located in {dest}.")
                sim = h.get("similarity_score")
                sim_str = f" (Match Score: {int(sim*100)}%)" if sim else ""

                lines.append(f"\n### {idx + 1}. {h_name}{sim_str}")
                lines.append(f"- **Rating:** ⭐ {h_rating}/5.0 | **Estimated Rate:** ${h_price}/night")
                lines.append(f"- **Overview:** {h_desc}")
                lines.append(f"💡 **Why This Was Chosen:** Selected for exceptional comfort in {dest}, matching your {budget} tier preference and proximity to key attractions.")
        else:
            lines.append(f"\n### 1. {dest} Grand Heritage Hotel")
            lines.append(f"- **Rating:** ⭐ 4.8/5.0 | **Estimated Rate:** ${120 if budget=='Luxury' else 35 if budget=='Budget' else 65}/night")
            lines.append(f"- **Overview:** Prime accommodation featuring authentic Sri Lankan hospitality in {dest}.")
            lines.append(f"💡 **Why This Was Chosen:** Top-ranked hospitality recommendation in {dest} tailored to your budget choice.")

        # Day-by-day breakdown for this city
        lines.append(f"\n### 🗓️ Daily Sightseeing & Activities ({dest})")
        poi_idx = 0

        for d in range(start_d, end_d + 1):
            lines.append(f"\n#### Day {d}: Highlights of {dest}")
            day_pois = city_poi[poi_idx:poi_idx + 2] if city_poi else []
            poi_idx += 2

            if day_pois:
                for p in day_pois:
                    p_name = p.get("name", f"{dest} Landmark")
                    p_cat = p.get("categories", ["Attraction"])[0] if isinstance(p.get("categories"), list) and p.get("categories") else "Attraction"
                    p_rating = p.get("rating", 4.7)
                    p_desc = p.get("description", f"Popular attraction in {dest}.")

                    lines.append(f"- **Visit:** **{p_name}** ({p_cat})")
                    lines.append(f"  - **Rating:** ⭐ {p_rating}/5.0")
                    lines.append(f"  - **Details:** {p_desc}")
                    lines.append(f"  - 💡 **Why This Was Chosen:** Highlighted because it matches your interest in *{vibe}* and offers top visitor reviews in {dest}.")
            else:
                lines.append(f"- **Morning:** Explore historic landmarks, local markets, and cultural sites in {dest}.")
                lines.append(f"  - 💡 **Why This Was Chosen:** Authentic local experience representing the cultural heritage of {dest}.")
                lines.append(f"- **Afternoon:** Scenic nature walk, authentic dining, and evening leisure in {dest}.")
                lines.append(f"  - 💡 **Why This Was Chosen:** Relaxing sightseeing tailored to your requested vibe.")

    lines.append("\n---\n")
    lines.append("### 🚗 Travel & Transport Logistics")
    lines.append(f"Inter-city transfers across {dest_str} are arranged via private air-conditioned vehicle with dedicated local guide/driver.")

    return "\n".join(lines)


def generate_explainable_itinerary(agent2_output: Union[Dict[str, Any], str]) -> Dict[str, Any]:
    """
    Agent 3: Explainer & Travel Guide Router.
    Parses Agent 2 retrieval payload, attempts local Ollama LLM execution,
    and returns a structured dict containing itinerary_markdown and suggested_places_by_destination.
    """
    # 1. Parse JSON Input
    try:
        if isinstance(agent2_output, dict):
            payload = agent2_output
        else:
            payload = json.loads(agent2_output)
    except Exception as e:
        logger.error(f"Agent 3 failed to parse Agent 2 output JSON: {e}")
        return {
            "itinerary_markdown": "### ⚠️ Error Generating Itinerary\nInvalid input type received.",
            "suggested_places_by_destination": {}
        }

    # Check for security or retrieval errors
    if "error" in payload:
        err_msg = payload.get("error", "Invalid travel request.")
        logger.warning(f"Propagating error message in Agent 3: {err_msg}")
        return {
            "itinerary_markdown": f"### ⚠️ Invalid Request\n\n{err_msg}",
            "suggested_places_by_destination": {}
        }

    # Assemble structured suggested places payload for frontend
    suggested_places = extract_suggested_places_by_destination(payload)

    # 2. Query Local LLM (Ollama) if available
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "llama3:latest")
    
    prompt_content = f"{SYSTEM_PROMPT_AGENT_3}\n\nDATA PAYLOAD FROM AGENT 2:\n{json.dumps(payload, indent=2, default=str)}"

    try:
        logger.info(f"Attempting Ollama LLM query to {ollama_host} (model: {ollama_model})...")
        resp = requests.post(
            f"{ollama_host}/api/generate",
            json={
                "model": ollama_model,
                "prompt": prompt_content,
                "stream": False
            },
            timeout=3
        )
        if resp.status_code == 200:
            res_json = resp.json()
            llm_text = res_json.get("response", "").strip()
            if llm_text and "Why This Was Chosen" in llm_text:
                logger.info("Ollama LLM successfully generated itinerary.")
                return {
                    "itinerary_markdown": llm_text,
                    "suggested_places_by_destination": suggested_places
                }
    except Exception as ollama_err:
        logger.info(f"Ollama LLM offline or unreachable ({ollama_err}). Switching to deterministic XAI fallback engine.")

    # 3. Fallback to Deterministic XAI Itinerary Builder
    logger.info("Generating itinerary via deterministic XAI engine...")
    markdown_itinerary = generate_deterministic_markdown_itinerary(payload)

    return {
        "itinerary_markdown": markdown_itinerary,
        "suggested_places_by_destination": suggested_places
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Agent 3: Explainer & Travel Guide Router")
    parser.add_argument("--prompt", type=str, default="first i want to go galle and enjoy beach. then i want to go kandy.", help="User prompt")
    args = parser.parse_args()

    sample_payload = {
        "destinations": ["Galle", "Kandy"],
        "intake_params": {
            "destinations": ["Galle", "Kandy"],
            "destination": "Galle",
            "budget_tier": "Standard",
            "duration_days": 5,
            "vibe_query": args.prompt
        },
        "search_results_by_destination": {
            "Galle": {
                "hotels": [{"id": "h1", "name": "Galle Fort Hotel", "city": "Galle", "rating": 4.8, "avg_nightly_usd": 75}],
                "poi": [{"id": "p1", "name": "Galle Dutch Fort", "city": "Galle", "rating": 4.9, "ticket_price_usd": 0}]
            },
            "Kandy": {
                "hotels": [{"id": "h2", "name": "Earl's Regency", "city": "Kandy", "rating": 4.7, "avg_nightly_usd": 90}],
                "poi": [{"id": "p2", "name": "Temple of the Tooth", "city": "Kandy", "rating": 4.9, "ticket_price_usd": 10}]
            }
        }
    }

    result = generate_explainable_itinerary(sample_payload)
    print(result["itinerary_markdown"])
    print("\n--- SUGGESTED PLACES PAYLOAD ---")
    print(json.dumps(result["suggested_places_by_destination"], indent=2))
