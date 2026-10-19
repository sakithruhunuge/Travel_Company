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

proj_root = os.path.dirname(os.path.dirname(curr_file_dir))
if proj_root not in sys.path:
    sys.path.insert(0, proj_root)

if site_pkg_dir and site_pkg_dir not in sys.path:
    sys.path.append(site_pkg_dir)

if etl_dir and etl_dir not in sys.path:
    sys.path.append(etl_dir)

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
    # Direct instruction overrides and synonyms
    r"\b(ignore|disregard|neglect|forget|bypass|override|dismiss|skip|drop|abandon|cancel|void)\s+(all\s+)?(previous|prior|above|existing|system|default|original|past|earlier)?\s*(instructions|prompts|rules|guidelines|directives|constraints|guardrails|policies|filters|context)\b",
    # Authority and role spoofing
    r"\b(system|developer|admin|root|superuser|maintenance|debug)\s*(prompt|mode|directive|override|instructions|token|access|notice|state)\b",
    r"\[(admin|system|developer|maintenance|authorization).*?\]",
    # System prompt extraction and leakage attempts
    r"\b(reveal|show|print|dump|output|display|leak|exfiltrate|repeat|tell\s+me)\s+(your\s+|the\s+)?(system|internal|hidden|secret|initial|original|confidential)\s*(prompt|instructions|rules|configuration|context)\b",
    # Jailbreak / persona switching
    r"\byou\s+are\s+now\s+(an?|in)?\s*(unrestricted|jailbroken|dan|developer|god|unfiltered|jailbreak|evil|assistant)\b",
    r"\bact\s+as\s+(an?|in)?\s*(unrestricted|dan|developer\s+mode|jailbreak|jailbroken|evil|adversary)\b",
    r"\bsudo\s+mode\b",
    # Hypothetical / roleplay jailbreaks
    r"\b(fictional|hypothetical)\s+(scenario|play|game|story)\s+where\s+.*(secret|system\s+instructions|confidential|rules|jailbreak)",
    r"\bimagine\s+.*(recites?|reveals?|bypasses?|unrestricted|secret\s+instructions|system\s+prompt)",
    # Delimiter spoofing & conversation turn forging
    r"--- (end of|system|human|ai|assistant|user) ---",
    r"--- end of user query ---",
    r"<\/?(system|prompt|instruction|context|admin)>",
    # Markdown image exfiltration beacons
    r"!\[.*?\]\((https?:\/\/.*?)\)",
    # Phishing / credential harvesting link injection
    r"\[.*?\]\((https?:\/\/.*?(phishing|evil|attacker|login|steal).*?)\)",
    # Downstream format / JSON schema hijacking
    r"\b(respond\s+(only|exclusively)\s+with\s+raw\s+json|format\s+.*as\s+raw\s+unescaped\s+json|terminate\s+markdown\s+and\s+output\s+json)\b",
    # Multilingual instruction overrides (German, French, Spanish)
    r"\b(ignoriere|vergiss|missachte)\s+.*(anweisungen|regeln|prompt|instruktionen)\b",
    r"\b(ignore|oublie|outrepasse)\s+.*(instructions|règles|consignes|prompt)\b",
    r"\b(ignora|olvida|omite)\s+.*(instrucciones|reglas|prompt)\b",
]

# Off-topic keywords/intent indicators (non-travel requests & cyber-offensive requests)
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
    r"stock\s+market",
    # Cyber-offensive / exploit patterns (disallow even when paired with travel destinations)
    r"\b(keylogger|malware|reverse\s*shell|ransomware|exploit|sql\s*injection|xss\s*payload|buffer\s*overflow|trojan|rootkit|payload)\b",
    r"write\s+a\s+(malicious|offensive|harmful)\s+",
    # SQL injection / database manipulation commands
    r"\b(drop\s+table|delete\s+from|insert\s+into|union\s+select|select\s+.*\s+from)\b",
    r";\s*(drop|delete|select|insert|update|alter)\b",
    r"--\s*$"
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


def normalize_for_inspection(text: str) -> str:
    """
    Normalizes text to neutralize obfuscation (leetspeak, zero-width chars, base64 smuggling).
    """
    if not text or not isinstance(text, str):
        return ""
    
    # Remove zero-width characters and control codes
    cleaned = re.sub(r"[\u200b\u200c\u200d\uFEFF\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
    
    # Unpack simple leetspeak substitutions: 0->o, 1->i, 3->e, 4->a, @->a, $->s, 5->s, 7->t
    leetspeak_map = {
        '0': 'o', '1': 'i', '3': 'e', '4': 'a', '@': 'a',
        '$': 's', '5': 's', '7': 't', '!': 'i'
    }
    leet_normalized = "".join(leetspeak_map.get(ch, ch) for ch in cleaned)
    
    # Check for embedded Base64 strings (both contiguous and space-separated tokens)
    import base64
    decoded_fragments = []
    
    # Match candidate base64 sequences (e.g. sequences with length >= 8)
    b64_matches = re.findall(r"[A-Za-z0-9+/=]{8,}", cleaned)
    for candidate in b64_matches:
        try:
            raw_bytes = base64.b64decode(candidate)
            decoded_str = raw_bytes.decode('utf-8', errors='ignore').strip()
            # Only keep printable ASCII text with real letters
            if len(decoded_str) >= 4 and any(ch.isalpha() for ch in decoded_str) and all(32 <= ord(c) < 127 for c in decoded_str):
                decoded_fragments.append(decoded_str)
        except Exception:
            pass

    if decoded_fragments:
        return f"{cleaned} {leet_normalized} {' '.join(decoded_fragments)}"
    return f"{cleaned} {leet_normalized}"


def is_security_threat_or_off_topic(text: str) -> bool:
    """
    Evaluates input text for prompt injection attempts, system overrides, or off-topic requests.
    Inspects both raw and de-obfuscated representations.
    """
    if not text or not isinstance(text, str):
        return False
        
    lower_text = text.lower().strip()
    if not lower_text:
        return False

    normalized_text = normalize_for_inspection(text).lower()

    # Check for prompt injection patterns across both original and normalized text
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, lower_text, re.I) or re.search(pattern, normalized_text, re.I):
            logger.warning(f"Security Shield Triggered: Prompt injection pattern detected ('{pattern}')")
            return True

    # Check for off-topic or cyber-offensive requests
    for pattern in OFF_TOPIC_PATTERNS:
        if re.search(pattern, lower_text, re.I) or re.search(pattern, normalized_text, re.I):
            logger.warning(f"Security Shield Triggered: Off-topic / prohibited request detected ('{pattern}')")
            return True

    return False


def resolve_canonical_destination(candidate: str) -> Optional[str]:
    """
    Resolves a candidate destination string to a canonical known Sri Lankan destination.
    Returns canonical name if valid, otherwise None.
    """
    if not candidate or not isinstance(candidate, str):
        return None
    
    clean_candidate = re.sub(r"[\r\n\t]", " ", candidate).strip()
    if not clean_candidate or len(clean_candidate) > 50:
        return None
        
    # Match against synonym patterns
    for canon_dest, patterns in DESTINATION_SYNONYMS.items():
        for pat in patterns:
            if re.search(r"^\s*" + pat + r"\s*$", clean_candidate, re.I):
                return canon_dest
            if re.search(r"\b" + pat + r"\b", clean_candidate, re.I) and len(clean_candidate) < 30:
                return canon_dest

    # Match against known destinations list
    for dest in KNOWN_DESTINATIONS:
        if dest.lower() == clean_candidate.lower():
            return dest
            
    return None


def extract_destinations(text: str, fallback: Optional[Union[str, List[str]]] = None) -> List[str]:
    """
    Extracts an ordered list of target Sri Lankan destinations mentioned in input text or fallback.
    Strictly validates all fallback destinations against the known destinations allowlist to prevent
    parameter injection or instruction spill.
    """
    # Rule A: Honor explicit fallback if provided AND validated against allowlist
    if fallback:
        raw_list = fallback if isinstance(fallback, list) else [fallback]
        valid_fallback: List[str] = []
        for item in raw_list:
            resolved = resolve_canonical_destination(str(item))
            if resolved and resolved not in valid_fallback:
                valid_fallback.append(resolved)
        if valid_fallback:
            return valid_fallback

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
    Extracts and normalizes budget_tier strictly to ('Budget', 'Standard', 'Luxury').
    Recognizes star classifications (5-star, 4-star, 3-star) and budget terms.
    Sanitizes against SQL/command injection metacharacters.
    """
    # Sanitize inputs by stripping punctuation, quotes, and SQL/command metacharacters
    clean_text = re.sub(r"[;'\";\-\-\/\\=]", " ", text or "").lower()
    clean_fb = re.sub(r"[;'\";\-\-\/\\=]", " ", fallback or "").lower()
    candidate = f"{clean_text} {clean_fb}".strip()
    
    # Check 5-star or luxury
    if any(k in candidate for k in ["5 star", "5-star", "five star", "luxury", "expensive", "boutique villa"]):
        return "Luxury"
    # Check budget / 3-star
    elif any(k in candidate for k in ["budget", "cheap", "affordable", "backpack", "hostel", "guesthouse", "3 star", "3-star", "three star"]):
        return "Budget"
    # Check 4-star or standard
    elif any(k in candidate for k in ["4 star", "4-star", "four star", "standard", "mid-range"]):
        return "Standard"
    elif clean_fb:
        if "lux" in clean_fb:
            return "Luxury"
        elif "bud" in clean_fb:
            return "Budget"
        return "Standard"
    else:
        return "Standard"


def extract_duration_days(text: str, fallback: Optional[Any] = None) -> int:
    """
    Extracts integer duration_days, strictly clamped between 1 and 30 days.
    """
    if fallback is not None:
        try:
            val = int(fallback)
            if val > 0:
                return min(30, max(1, val))
        except (ValueError, TypeError):
            pass

    if text and isinstance(text, str):
        match = re.search(r"\b(\d+)\s*(?:day|days|night|nights)\b", text, re.I)
        if match:
            try:
                val = int(match.group(1))
                if val > 0:
                    return min(30, max(1, val))
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
    combined_text = f"{user_prompt} {dest_str} {' '.join(str(a) for a in preferred_attrs) if isinstance(preferred_attrs, list) else ''}".strip()

    # Rule 1: SECURITY SHIELD CHECK (Inspects both combined text and structured parameters)
    if is_security_threat_or_off_topic(combined_text) or is_security_threat_or_off_topic(str(provided_dest)) or is_security_threat_or_off_topic(str(provided_budget)):
        return error_response

    # Rule 2: MULTI-DESTINATION PARAMETER EXTRACTION (Ordered & Allowlisted)
    destinations = extract_destinations(combined_text, fallback=provided_dest)
    primary_destination = destinations[0]

    # Sanitize package_template
    if package_template and not isinstance(package_template, str):
        package_template = str(package_template)[:100]
    elif package_template:
        package_template = re.sub(r"[<>\r\n]", "", str(package_template))[:100]
    else:
        package_template = None

    # Sanitize and validate selected_place_ids
    clean_place_ids: List[str] = []
    if isinstance(selected_place_ids, list):
        for pid in selected_place_ids:
            clean_pid = re.sub(r"[^\w\s\-]", "", str(pid)).strip()
            if clean_pid and len(clean_pid) < 80:
                clean_place_ids.append(clean_pid)
    elif selected_place_ids:
        clean_pid = re.sub(r"[^\w\s\-]", "", str(selected_place_ids)).strip()
        if clean_pid and len(clean_pid) < 80:
            clean_place_ids.append(clean_pid)

    for d in destinations:
        if d not in clean_place_ids:
            clean_place_ids.append(d)

    budget_tier = extract_budget_tier(combined_text, fallback=provided_budget)
    duration_days = extract_duration_days(combined_text, fallback=provided_duration)

    # Sanitize preferred attributes
    sanitized_attrs: List[str] = []
    if isinstance(preferred_attrs, list):
        for attr in preferred_attrs[:10]:
            clean_a = re.sub(r"[<>\r\n;]", "", str(attr)).strip()
            if clean_a and len(clean_a) < 60:
                sanitized_attrs.append(clean_a)

    # Sanitize user prompt to remove markdown exfiltration beacons, tags, and delimiters
    clean_prompt = re.sub(r"!\[.*?\]\(.*?\)", "", user_prompt)
    clean_prompt = re.sub(r"<.*?>", "", clean_prompt)
    clean_prompt = re.sub(r"---.*?---", "", clean_prompt).strip()[:500]

    attrs_str = ", ".join(sanitized_attrs)
    if clean_prompt and attrs_str:
        vibe_query = f"{clean_prompt}, {attrs_str}"
    elif clean_prompt:
        vibe_query = clean_prompt
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
        "selected_place_ids": clean_place_ids,
        "sanitized_prompt": clean_prompt
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
