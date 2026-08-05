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
    "Udawalawe", "Pasikuda", "Wilpattu", "Weligama", "Unawatuna", "Matara"
]

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
    r"sql\s+query"
]


def is_security_threat_or_off_topic(text: str) -> bool:
    """
    Evaluates input text against security injection patterns and off-topic domain filters.
    """
    if not text or not isinstance(text, str):
        return False

    clean_text = text.strip()

    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, clean_text, re.I):
            logger.warning(f"Security shield triggered! Prompt injection pattern matched: '{pattern}'")
            return True

    for pattern in OFF_TOPIC_PATTERNS:
        if re.search(pattern, clean_text, re.I):
            logger.warning(f"Off-topic shield triggered! Non-travel pattern matched: '{pattern}'")
            return True

    return False


def extract_all_destinations(text: str, fallback: Optional[Union[str, List[str]]] = None) -> List[str]:
    """
    Extracts ALL target Sri Lankan destination cities/regions mentioned in input text or fallback.
    Supports multi-destination prompts (e.g. 'Galle and Kandy').
    """
    found: List[str] = []

    if fallback:
        if isinstance(fallback, list):
            for item in fallback:
                if str(item).strip() and str(item).strip().title() not in found:
                    found.append(str(item).strip().title())
        elif isinstance(fallback, str) and fallback.strip():
            found.append(fallback.strip().title())

    if text and isinstance(text, str):
        for dest in KNOWN_DESTINATIONS:
            if re.search(r"\b" + re.escape(dest) + r"\b", text, re.I):
                if dest not in found:
                    found.append(dest)

    if not found:
        return ["Colombo"]
    return found


def extract_budget_tier(text: str, fallback: Optional[str] = None) -> str:
    """
    Extracts and normalizes budget_tier ('Budget', 'Standard', 'Luxury').
    """
    candidate = (fallback or text or "").lower()
    if "luxury" in candidate or "premium" in candidate or "expensive" in candidate:
        return "Luxury"
    elif "budget" in candidate or "cheap" in candidate or "affordable" in candidate or "backpack" in candidate:
        return "Budget"
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
    and extracts all target travel parameters (supporting multi-destination prompts).
    """
    error_response = json.dumps({"error": "Invalid travel request."}, indent=2)

    # Normalize input variables
    if isinstance(submission, dict):
        user_prompt = str(submission.get("user_prompt") or submission.get("prompt") or "")
        provided_dest = submission.get("destination")
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
    combined_text = f"{user_prompt} {provided_dest or ''} {' '.join(preferred_attrs) if isinstance(preferred_attrs, list) else ''}".strip()

    # Rule 1: SECURITY SHIELD CHECK
    if is_security_threat_or_off_topic(combined_text):
        return error_response

    # Rule 2: MULTI-DESTINATION PARAMETER EXTRACTION
    dest_list = extract_all_destinations(combined_text, fallback=provided_dest)
    destination = ", ".join(dest_list)

    if package_template and not isinstance(package_template, str):
        package_template = str(package_template)
    elif not package_template:
        package_template = None

    if not isinstance(selected_place_ids, list):
        selected_place_ids = [str(selected_place_ids)] if selected_place_ids else []
    else:
        selected_place_ids = [str(pid) for pid in selected_place_ids if pid]

    for d in dest_list:
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
        vibe_query = f"{destination} tour"

    structured_output = {
        "destination": destination,
        "destinations_list": dest_list,
        "budget_tier": budget_tier,
        "duration_days": duration_days,
        "vibe_query": vibe_query,
        "package_template": package_template,
        "selected_place_ids": selected_place_ids,
        "sanitized_prompt": user_prompt
    }

    logger.info(f"Agent 1 Intake successfully parsed parameters: destinations={dest_list}, budget='{budget_tier}', duration={duration_days}")
    return json.dumps(structured_output, indent=2)
