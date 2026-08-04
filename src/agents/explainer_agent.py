import os
import sys
import json
import requests
import importlib
from typing import Union, Dict, Any, Optional, List

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
    logger = logging.getLogger("explainer_agent")

SYSTEM_PROMPT_AGENT_3 = """You are an expert, friendly Sri Lankan travel guide and itinerary planner.

RULES:
1. INPUT: Receive the user's selected package/places and prompt alongside raw JSON records from Agent 2.
2. GENERATION: Construct a complete, day-by-day travel itinerary formatted in clean, elegant Markdown.
3. EXPLAINABLE AI (XAI) REQUIREMENT:
   - For EVERY hotel and attraction recommended, you MUST include a dedicated block:
     '💡 Why This Was Chosen:'
   - Ground your reasoning strictly in the provided JSON fields (e.g., "Chosen because its $45/night rate fits your Budget tier, and it is located 12 km from BIA airport with a 4.7 popularity rating").
4. PACKAGES & SELECTIONS: If the user chose a specific package template or favorite places, explicitly integrate them into the daily schedule first before filling in surrounding activities.
5. Never invent fake locations not present in the provided JSON data."""


def generate_xai_reasoning_for_hotel(hotel: Dict[str, Any], budget_tier: str) -> str:
    """
    Generates a grounded Explainable AI (XAI) rationale block for a hotel recommendation.
    """
    name = hotel.get("name", "Hotel")
    price = hotel.get("avg_nightly_usd")
    price_str = f"${price:.2f}/night" if price is not None else "Competitive seasonal rates"
    tier = hotel.get("price_tier") or budget_tier or "Standard"
    dist_km = hotel.get("airport_distance_km")
    dist_min = hotel.get("airport_travel_time_min")
    dist_str = f"{dist_km:.1f} km ({dist_min:.0f} mins travel time)" if (dist_km is not None and dist_min is not None) else "Convenient airport access"
    rating = hotel.get("rating")
    reviews = hotel.get("review_count", 0)
    rating_str = f"{rating}/5.0 based on {reviews} reviews" if (rating is not None and rating > 0) else "Highly recommended local stay"
    sim_score = hotel.get("similarity_score")
    sim_str = f"Vector similarity match score: {sim_score:.4f}" if sim_score is not None else "Strong match with vibe preferences"
    city = hotel.get("city", "Sri Lanka")

    reasons = [
        f"Fits your {tier} tier budget with an average rate of {price_str}.",
        f"Located in {city}, approximately {dist_str} from Bandaranaike International Airport (BIA).",
        f"Guest satisfaction rating of {rating_str}.",
        f"Algorithmic relevance: {sim_str}."
    ]
    
    if hotel.get("has_pool"):
        reasons.append("Features swimming pool amenities.")
    if hotel.get("has_wifi"):
        reasons.append("Includes complimentary Wi-Fi.")
    if hotel.get("has_breakfast"):
        reasons.append("Includes daily breakfast.")

    bullet_list = "\n".join([f"  - {r}" for r in reasons])
    return f"💡 **Why This Was Chosen:**\n{bullet_list}"


def generate_xai_reasoning_for_poi(poi: Dict[str, Any], vibe_query: str) -> str:
    """
    Generates a grounded Explainable AI (XAI) rationale block for an attraction (POI) recommendation.
    """
    name = poi.get("name", "Attraction")
    city = poi.get("city", "Sri Lanka")
    cats = poi.get("categories") or []
    cat_str = ", ".join(cats) if isinstance(cats, list) and cats else "sightseeing"
    dist_km = poi.get("airport_distance_km")
    dist_min = poi.get("airport_travel_time_min")
    dist_str = f"{dist_km:.1f} km ({dist_min:.0f} mins travel time)" if (dist_km is not None and dist_min is not None) else "accessible location"
    rating = poi.get("rating")
    pop_index = poi.get("popularity_index")
    pop_str = f"Popularity score of {pop_index:.2f}" if (pop_index is not None and pop_index > 0) else "Top rated local attraction"
    sim_score = poi.get("similarity_score")
    sim_str = f"Similarity score: {sim_score:.4f}" if sim_score is not None else "Matches travel intent"

    reasons = [
        f"Categorized as [{cat_str}] in {city}.",
        f"Located {dist_str} from Bandaranaike International Airport (BIA).",
        f"Destination metrics: {pop_str}.",
        f"Relevance: {sim_str} matching query '{vibe_query}'."
    ]

    bullet_list = "\n".join([f"  - {r}" for r in reasons])
    return f"💡 **Why This Was Chosen:**\n{bullet_list}"


def generate_deterministic_markdown_itinerary(payload: Dict[str, Any]) -> str:
    """
    Fallback Engine: Constructs a structured, 100% compliant Markdown travel itinerary
    with grounded XAI blocks when Ollama LLM is unavailable.
    """
    intake = payload.get("intake_params", {})
    search_res = payload.get("search_results", {})
    fallback_triggered = payload.get("fallback_triggered", False)

    destination = intake.get("destination", "Sri Lanka")
    budget_tier = intake.get("budget_tier", "Standard")
    duration_days = intake.get("duration_days", 3)
    vibe_query = intake.get("vibe_query", "")
    package_template = intake.get("package_template")
    selected_place_ids = set(intake.get("selected_place_ids") or [])

    hotels = search_res.get("hotels", [])
    pois = search_res.get("poi", [])

    md_lines = []
    
    # Title & Overview Header
    md_lines.append(f"# 🌴 {duration_days}-Day Sri Lanka Travel Itinerary: {destination}")
    md_lines.append(f"**Target Destination:** {destination} | **Budget Tier:** {budget_tier} | **Duration:** {duration_days} Days")
    md_lines.append(f"**Vibe & Intent:** *\"{vibe_query}\"*")
    if package_template:
        md_lines.append(f"**Selected Package Template:** `{package_template}`")
    if fallback_triggered:
        md_lines.append("> ℹ️ *Note: Search criteria was broadened to ensure complete coverage.*")
    md_lines.append("\n---\n")

    # Hotel Recommendation
    md_lines.append("## 🏨 Featured Accommodation Options\n")
    if hotels:
        for idx, hotel in enumerate(hotels[:2], 1):
            h_name = hotel.get("name", f"Hotel #{idx}")
            h_city = hotel.get("city", destination)
            h_price = hotel.get("avg_nightly_usd")
            p_str = f"${h_price:.2f}/night" if h_price is not None else "Market rate"
            
            is_selected = (hotel.get("source_id") in selected_place_ids or hotel.get("id") in selected_place_ids)
            sel_tag = " ⭐ *(Your Selected Favorite)*" if is_selected else ""

            md_lines.append(f"### {idx}. {h_name} ({h_city}){sel_tag}")
            md_lines.append(f"- **Nightly Rate:** {p_str} | **Rating:** {hotel.get('rating', 'N/A')}/5.0")
            md_lines.append(f"- **Address:** {hotel.get('address') or h_city}")
            md_lines.append(generate_xai_reasoning_for_hotel(hotel, budget_tier))
            md_lines.append("")
    else:
        md_lines.append(f"No specific hotels matched in {destination}. Local boutique guesthouses recommended.")

    md_lines.append("\n---\n")
    md_lines.append("## 📅 Day-by-Day Travel Schedule\n")

    # Distribute POIs across days
    total_pois = len(pois)
    poi_index = 0

    for day in range(1, duration_days + 1):
        md_lines.append(f"### 🗓️ Day {day}: Exploring {destination}")
        
        # Morning Activity
        if poi_index < total_pois:
            poi = pois[poi_index]
            poi_index += 1
            is_sel = (poi.get("source_id") in selected_place_ids or poi.get("id") in selected_place_ids)
            sel_badge = " ⭐ *(Selected Place)*" if is_sel else ""
            
            md_lines.append(f"#### 🌅 Morning: Visit {poi.get('name')}{sel_badge}")
            if poi.get("description"):
                md_lines.append(f"*{poi.get('description')}*")
            md_lines.append(generate_xai_reasoning_for_poi(poi, vibe_query))
            md_lines.append("")
        else:
            md_lines.append(f"#### 🌅 Morning: Local Sightseeing & Cultural Walk in {destination}")
            md_lines.append("Enjoy a relaxed morning exploring local markets, artisan cafes, and scenic streets.\n")

        # Afternoon Activity
        if poi_index < total_pois:
            poi = pois[poi_index]
            poi_index += 1
            is_sel = (poi.get("source_id") in selected_place_ids or poi.get("id") in selected_place_ids)
            sel_badge = " ⭐ *(Selected Place)*" if is_sel else ""
            
            md_lines.append(f"#### ☀️ Afternoon: Discover {poi.get('name')}{sel_badge}")
            if poi.get("description"):
                md_lines.append(f"*{poi.get('description')}*")
            md_lines.append(generate_xai_reasoning_for_poi(poi, vibe_query))
            md_lines.append("")
        else:
            md_lines.append(f"#### ☀️ Afternoon: Leisure & Coastal Relaxation")
            md_lines.append("Relax by the beach or pool, enjoying authentic Sri Lankan tea and local delicacies.\n")

        # Evening Accommodation / Dining
        md_lines.append("#### 🌙 Evening: Dinner & Accommodation")
        if hotels:
            main_hotel = hotels[0]
            md_lines.append(f"Retire for the evening at **{main_hotel.get('name')}** in {main_hotel.get('city')}.")
        else:
            md_lines.append(f"Enjoy evening dining at a top-rated local restaurant in {destination}.")
        md_lines.append("")

    # Useful Travel Tips Footer
    md_lines.append("---")
    md_lines.append("### 💡 Practical Sri Lanka Travel Advice")
    md_lines.append("- **Transport:** Tuktuks for short trips; private AC vehicles for transfers.")
    md_lines.append("- **Etiquette:** Modest attire required when visiting religious temples.")
    md_lines.append("- **Currency:** Sri Lankan Rupee (LKR); USD accepted at major hotels.")

    return "\n".join(md_lines)


def generate_explainable_itinerary(agent2_output: Union[Dict[str, Any], str]) -> str:
    """
    Agent 3: Travel Guide & Explainer.
    Receives Agent 2 payload, invokes local LLM (Ollama) to format a Markdown itinerary
    with Explainable AI (XAI) rationale blocks ('💡 Why This Was Chosen:'), falling back
    to a deterministic NLP engine if Ollama is offline.

    Parameters:
        agent2_output (Dict or str): Output from Agent 2.

    Returns:
        str: Clean Markdown itinerary string.
    """
    logger.info("Executing Agent 3: Travel Guide & Explainer...")

    # 1. Parse Agent 2 Output Payload
    if isinstance(agent2_output, str):
        try:
            payload = json.loads(agent2_output)
        except Exception as e:
            logger.error(f"Failed to parse Agent 2 JSON string payload: {e}")
            return "### ⚠️ Error Generating Itinerary\nInvalid input payload format received from Agent 2."
    elif isinstance(agent2_output, dict):
        payload = agent2_output
    else:
        return "### ⚠️ Error Generating Itinerary\nInvalid input type received."

    # Check for security or retrieval errors propagated from earlier agents
    if "error" in payload:
        err_msg = payload.get("error", "Invalid travel request.")
        logger.warning(f"Propagating error message in Agent 3: {err_msg}")
        return f"### ⚠️ Invalid Request\n\n{err_msg}"

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
            timeout=8
        )
        if resp.status_code == 200:
            res_json = resp.json()
            llm_text = res_json.get("response", "").strip()
            if llm_text and "Why This Was Chosen" in llm_text:
                logger.info("Ollama LLM successfully generated itinerary.")
                return llm_text
    except Exception as ollama_err:
        logger.info(f"Ollama LLM offline or unreachable ({ollama_err}). Switching to deterministic XAI fallback engine.")

    # 3. Fallback to Deterministic XAI Itinerary Builder
    logger.info("Generating itinerary via deterministic XAI engine...")
    return generate_deterministic_markdown_itinerary(payload)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Test Agent 3: Travel Guide & Explainer")
    parser.add_argument("--destination", type=str, default="Galle", help="Target city")
    args = parser.parse_args()

    dummy_agent2_payload = json.dumps({
        "intake_params": {
            "destination": args.destination,
            "budget_tier": "Standard",
            "vibe_query": "quiet beach historic fort seafood",
            "selected_place_ids": [],
            "duration_days": 3,
            "package_template": None
        },
        "search_results": {
            "hotels": [
                {
                    "id": "6a6842a4e569eb40fdc9f7e4",
                    "source_id": "booking_aquarius_stay",
                    "name": "AQUARIUS Stay",
                    "city": "Tangalle",
                    "avg_nightly_usd": 55.0,
                    "rating": 4.5,
                    "review_count": 12,
                    "airport_distance_km": 160.8,
                    "airport_travel_time_min": 241.2,
                    "similarity_score": 0.785
                }
            ],
            "poi": [
                {
                    "id": "6a62d854e753bceeb2773296",
                    "source_id": "osm_way_136845474",
                    "name": "National Museum Fort",
                    "city": "Galle",
                    "categories": ["museum"],
                    "popularity_index": 0.85,
                    "airport_distance_km": 132.5,
                    "airport_travel_time_min": 198.8,
                    "similarity_score": 0.82
                }
            ]
        },
        "fallback_triggered": False
    })

    result_md = generate_explainable_itinerary(dummy_agent2_payload)
    print(result_md)
