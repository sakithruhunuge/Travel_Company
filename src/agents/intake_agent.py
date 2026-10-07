import os
import sys
import re
import json
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
    logger = logging.getLogger("intake_agent")

# Known Sri Lanka Destinations List for extraction
KNOWN_DESTINATIONS = [
    "Colombo", "Galle", "Bentota", "Dambulla", "Kandy", "Ella", "Sigiriya", 
    "Mirissa", "Trincomalee", "Nuwara Eliya", "Jaffna", "Yala", "Arugam Bay",
    "Negombo", "Hikkaduwa", "Anuradhapura", "Polonnaruwa", "Tangalle",
    "Udawalawe", "Pasikuda", "Wilpattu", "Weligama", "Unawatuna", "Matara",
    "Badulla", "Haputale", "Horton Plains", "Knuckles Range", "Kitulgala",
    "Ratnapura", "Batticaloa", "Mannar", "Kalpitiya", "Sinharaja",
    "Minneriya", "Kaudulla", "Tissamaharama", "Beruwala", "Pinnawala"
]

# Destination aliases and flexible patterns (e.g. nuwaraeliya, arugambay, etc.)
DESTINATION_SYNONYMS: Dict[str, List[str]] = {
    "Nuwara Eliya": [r"nuwara\s*eliya", r"nuwaraeliya", r"little\s+england", r"nanu\s*oya"],
    "Kandy": [r"kandy", r"maha\s*nuwara"],
    "Sigiriya": [r"sigiriya", r"lion\s*rock"],
    "Dambulla": [r"dambulla"],
    "Ella": [r"ella"],
    "Galle": [r"galle", r"galle\s*fort"],
    "Bentota": [r"bentota"],
    "Colombo": [r"colombo"],
    "Negombo": [r"negombo", r"katunayake", r"bandaranaike"],
    "Mirissa": [r"mirissa"],
    "Yala": [r"yala"],
    "Trincomalee": [r"trincomalee", r"trinco"],
    "Jaffna": [r"jaffna"],
    "Arugam Bay": [r"arugam\s*bay", r"arugambay"],
    "Horton Plains": [r"horton\s*plains", r"hortonplains", r"world'?s\s*end"],
    "Knuckles Range": [r"knuckles(\s*range)?"],
    "Pinnawala": [r"pinnawala", r"pinnawela"],
    "Anuradhapura": [r"anuradhapura"],
    "Polonnaruwa": [r"polonnaruwa"],
    "Hikkaduwa": [r"hikkaduwa"],
    "Weligama": [r"weligama"],
    "Unawatuna": [r"unawatuna"],
    "Tangalle": [r"tangalle", r"tangalla"],
    "Matara": [r"matara"],
    "Udawalawe": [r"udawalawe", r"uda\s*walawe"],
    "Wilpattu": [r"wilpattu"],
    "Sinharaja": [r"sinharaja"],
    "Minneriya": [r"minneriya"],
    "Kaudulla": [r"kaudulla"],
    "Pasikuda": [r"pasikuda", r"passekudah", r"pasikudah"],
    "Tissamaharama": [r"tissamaharama", r"tissa"],
    "Badulla": [r"badulla"],
    "Haputale": [r"haputale"],
    "Kitulgala": [r"kitulgala"],
    "Ratnapura": [r"ratnapura"],
    "Batticaloa": [r"batticaloa"],
    "Mannar": [r"mannar"],
    "Kalpitiya": [r"kalpitiya"],
    "Beruwala": [r"beruwala"],
}

# Security patterns to flag prompt injections, instruction overrides, or jailbreaks
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)",
    r"disregard\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)",
    r"system\s+prompt",
    r"you\s+are\s+now",
    r"forget\s+(your\s+)?(instructions|rules|system)",
    r"jailbreak",
    r"bypass\s+security",
    r"override\s+system",
    r"act\s+as\s+a\s+DAN",
    r"sudo\s+mode",
    r"developer\s+mode"
]

# Off-topic keywords/intent indicators (non-travel requests)
OFF_TOPIC_PATTERNS = [
    r"python\s+script",
    r"write\s+(a\s+)?code",
    r"fibonacci",
    r"solve\s+math",
    r"recipe\s+for",
    r"who\s+is\s+president",
    r"translate\s+to\s+french",
    r"sing\s+a\s+song",
    r"write\s+an?\s+essay",
    r"crypto\s+price",
    r"stock\s+market"
]

# Common travel keywords to validate legitimate travel intent
TRAVEL_KEYWORDS = [
    "travel", "trip", "tour", "hotel", "resort", "beach", "temple", "visit", 
    "stay", "vacation", "holiday", "itinerary", "flight", "place", "sightseeing",
    "galle", "colombo", "bentota", "kandy", "dambulla", "ella", "sigiriya",
    "mirissa", "trincomalee", "nuwara eliya", "nuwaraeliya", "jaffna", "yala", "budget",
    "luxury", "standard", "5-star", "4-star", "3-star", "5 star", "4 star", "3 star",
    "star", "stars", "hotel", "hotels", "guesthouse", "hostel", "pool", "view", "nature",
    "safari", "fort", "food",
    "package", "day", "days", "night", "nights", "recommend", "suggestion",
    "suggest", "plan", "planning", "want", "need", "looking", "find", "best",
    "good", "great", "sri lanka", "lanka", "island", "tourist", "traveler",
    "traveller", "family", "couple", "honeymoon", "solo", "group", "drive",
    "driver", "car", "bus", "train", "cheap", "affordable", "quiet", "ancient",
    "hill", "country", "wildlife", "seafood", "culture", "cultural"
]


def is_security_threat_or_off_topic(text: str) -> bool:
    """
    Evaluates input text for prompt injection attempts, system overrides, or off-topic requests.
    """
    if not text or not isinstance(text, str):
        return False
        
    lower_text = text.lower().strip()
    if not lower_text:
        return False

    # Check for prompt injection patterns
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, lower_text, re.I):
            logger.warning(f"Security Shield Triggered: Prompt injection pattern detected ('{pattern}')")
            return True

    # Check for off-topic non-travel requests
    for pattern in OFF_TOPIC_PATTERNS:
        if re.search(pattern, lower_text, re.I):
            logger.warning(f"Security Shield Triggered: Off-topic request detected ('{pattern}')")
            return True

    return False


def extract_destinations(text: str, fallback: Optional[Union[str, List[str]]] = None) -> List[str]:
    """
    Extracts an ordered list of target Sri Lankan destinations mentioned in input text or fallback.
    Uses character start index sorting to preserve exact prompt order (e.g. 'Kandy' before 'Nuwara Eliya').
    Handles variations like 'nuwaraeliya', 'nuwara eliya', 'arugambay', etc.
    """
    # Rule A: Honor explicit fallback if provided
    if fallback:
        if isinstance(fallback, list) and len(fallback) > 0:
            ordered_fallback = []
            for item in fallback:
                str_item = str(item).strip().title()
                if str_item and str_item not in ordered_fallback:
                    ordered_fallback.append(str_item)
            if ordered_fallback:
                return ordered_fallback
        elif isinstance(fallback, str) and fallback.strip():
            return [fallback.strip().title()]

    # Rule B: Index-sorted regex match extraction over text with synonym support
    matches: List[tuple[int, str]] = []

    if text and isinstance(text, str):
        # 1. Match against synonym patterns
        for canon_dest, patterns in DESTINATION_SYNONYMS.items():
            for pat in patterns:
                m = re.search(r"\b" + pat + r"\b", text, re.I)
                if m:
                    matches.append((m.start(), canon_dest))
                    break

        # 2. Match against any remaining known destinations
        matched_canon = {d for _, d in matches}
        for dest in KNOWN_DESTINATIONS:
            if dest not in matched_canon:
                m = re.search(r"\b" + re.escape(dest) + r"\b", text, re.I)
                if m:
                    matches.append((m.start(), dest))

    if matches:
        # Sort by character start position in sentence (first mentioned = first in list)
        matches.sort(key=lambda x: x[0])

        # Deduplicate while preserving first-occurrence order
        ordered_dests: List[str] = []
        for _, dest_name in matches:
            if dest_name not in ordered_dests:
                ordered_dests.append(dest_name)
        
        return ordered_dests

    # Rule C: Default fallback
    return ["Colombo"]


def extract_budget_tier(text: str, fallback: Optional[str] = None) -> str:
    """
    Extracts and normalizes budget_tier ('Budget', 'Standard', 'Luxury').
    Recognizes star classifications (5-star, 4-star, 3-star) and budget terms.
    """
    candidate = (text or fallback or "").lower()
    
    # Check 5-star or luxury
    if any(k in candidate for k in ["5 star", "5-star", "five star", "luxury", "expensive", "boutique villa"]):
        return "Luxury"
    # Check budget / 3-star
    elif any(k in candidate for k in ["budget", "cheap", "affordable", "backpack", "hostel", "guesthouse", "3 star", "3-star", "three star"]):
        return "Budget"
    # Check 4-star or standard
    elif any(k in candidate for k in ["4 star", "4-star", "four star", "standard", "mid-range"]):
        return "Standard"
    elif fallback:
        fb_lower = fallback.lower()
        if "lux" in fb_lower:
            return "Luxury"
        elif "bud" in fb_lower:
            return "Budget"
        return "Standard"
    else:
        return "Standard"


def extract_duration_days(text: str, fallback: Optional[Any] = None) -> int:
    """
    Extracts integer duration_days (defaulting to 3).
    """
    if fallback is not None:
        try:
            val = int(fallback)
            if val > 0:
                return val
        except (ValueError, TypeError):
            pass

    if text and isinstance(text, str):
        match = re.search(r"\b(\d+)\s*(?:day|days|night|nights)\b", text, re.I)
        if match:
            try:
                val = int(match.group(1))
                if val > 0:
                    return val
            except ValueError:
                pass

    return 3


def parse_intake_submission(submission: Union[Dict[str, Any], str]) -> str:
    """
    Agent 1: Intake & Security Router.
    Parses user web submission or raw prompt, sanitizes input against security threats,
    and extracts all target travel parameters in prompt order.
    """
    error_response = json.dumps({"error": "Invalid travel request."}, indent=2)

    # Normalize input variables
    if isinstance(submission, dict):
        user_prompt = str(submission.get("user_prompt") or submission.get("prompt") or "")
        provided_dest = submission.get("destinations") or submission.get("destination")
        package_template = submission.get("package_template")
        selected_place_ids = submission.get("selected_place_ids") or []
        provided_budget = submission.get("budget_tier")
        provided_duration = submission.get("duration_days")
        preferred_attrs = submission.get("preferred_attributes") or []
    elif isinstance(submission, str):
        user_prompt = submission.strip()
        provided_dest = None
        package_template = None
        selected_place_ids = []
        provided_budget = None
        provided_duration = None
        preferred_attrs = []
    else:
        logger.warning("Invalid submission payload type received.")
        return error_response

    # Combine text for security evaluation & parameter extraction
    dest_str = ", ".join(provided_dest) if isinstance(provided_dest, list) else (provided_dest or "")
    combined_text = f"{user_prompt} {dest_str} {' '.join(preferred_attrs) if isinstance(preferred_attrs, list) else ''}".strip()

    # Rule 1: SECURITY SHIELD CHECK
    if is_security_threat_or_off_topic(combined_text):
        return error_response

    # Rule 2: MULTI-DESTINATION PARAMETER EXTRACTION (Ordered)
    destinations = extract_destinations(combined_text, fallback=provided_dest)
    primary_destination = destinations[0]

    if package_template and not isinstance(package_template, str):
        package_template = str(package_template)
    elif not package_template:
        package_template = None

    if not isinstance(selected_place_ids, list):
        selected_place_ids = [str(selected_place_ids)] if selected_place_ids else []
    else:
        selected_place_ids = [str(pid) for pid in selected_place_ids if pid]

    for d in destinations:
        if d not in selected_place_ids:
            selected_place_ids.append(d)

    budget_tier = extract_budget_tier(combined_text, fallback=provided_budget)
    duration_days = extract_duration_days(combined_text, fallback=provided_duration)

    attrs_str = ", ".join(preferred_attrs) if isinstance(preferred_attrs, list) and preferred_attrs else ""
    if user_prompt and attrs_str:
        vibe_query = f"{user_prompt}, {attrs_str}"
    elif user_prompt:
        vibe_query = user_prompt
    elif attrs_str:
        vibe_query = attrs_str
    else:
        vibe_query = f"{', '.join(destinations)} tour"

    structured_output = {
        "destinations": destinations,
        "destination": primary_destination,
        "budget_tier": budget_tier,
        "duration_days": duration_days,
        "vibe_query": vibe_query,
        "package_template": package_template,
        "selected_place_ids": selected_place_ids,
        "sanitized_prompt": user_prompt
    }

    logger.info(f"Agent 1 Intake successfully parsed parameters: destinations={destinations}, budget='{budget_tier}', duration={duration_days}")
    return json.dumps(structured_output, indent=2)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Test Agent 1: Intake & Security Router")
    parser.add_argument("--prompt", type=str, default="first i want to go galle and enjoy beach. then i want to go kandy.", help="User prompt")
    args = parser.parse_args()

    result = parse_intake_submission(args.prompt)
    print(result)
