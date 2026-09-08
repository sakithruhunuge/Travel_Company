import os
import sys
import re
import json
import importlib
from typing import List, Dict, Any, Optional
import numpy as np

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

# Check T:\ drive fallback for Windows short path venv if available
if not site_pkg_dir and os.path.exists(r"T:\venv\Lib\site-packages"):
    site_pkg_dir = r"T:\venv\Lib\site-packages"

if site_pkg_dir and site_pkg_dir not in sys.path:
    sys.path.insert(0, site_pkg_dir)

if etl_dir and etl_dir not in sys.path:
    sys.path.insert(0, etl_dir)

proj_root = os.path.dirname(os.path.dirname(curr_file_dir))
if proj_root not in sys.path:
    sys.path.append(proj_root)

# --------------------------------------------------------------------------
# 2. DYNAMIC .ENV RESOLUTION & ENVIRONMENT SETUP
# --------------------------------------------------------------------------
def find_and_load_env():
    curr = curr_file_dir
    env_path = None
    for _ in range(6):
        candidate_env = os.path.join(curr, ".env")
        candidate_tc = os.path.join(curr, "Travel_Company", ".env")
        if os.path.exists(candidate_env):
            env_path = candidate_env
            break
        elif os.path.exists(candidate_tc):
            env_path = candidate_tc
            break
        parent = os.path.dirname(curr)
        if parent == curr:
            break
        curr = parent
    
    if env_path and os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("#") or not line or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k, v = k.strip(), v.strip()
                if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                    v = v[1:-1]
                if k == "SCRAPER_DB_URI":
                    os.environ["SCRAPER_DB_URI"] = v
                    os.environ["MONGODB_URI"] = v

find_and_load_env()
if "SCRAPER_DB_URI" not in os.environ or "37.60.226.84" in os.environ.get("SCRAPER_DB_URI", ""):
    db_uri = os.environ.get("MONGODB_URI") or "mongodb://localhost:27017/srilanka_travel"
    os.environ["SCRAPER_DB_URI"] = db_uri
    os.environ["MONGODB_URI"] = db_uri

# --------------------------------------------------------------------------
# 3. DYNAMIC RESILIENT MODULE IMPORTS (ELIMINATES LINTER SQUIGGLES)
# --------------------------------------------------------------------------
try:
    logger_mod = importlib.import_module("src.utils.logger")
    logger = logger_mod.logger
except Exception:
    import logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    logger = logging.getLogger("search_tool")

try:
    mongo_mod = importlib.import_module("src.db.mongo_client")
    MongoDBClient = mongo_mod.MongoDBClient
except Exception:
    try:
        pymongo_mod = importlib.import_module("pymongo")
        MongoClient = pymongo_mod.MongoClient
        class MongoDBClient:
            def __init__(self):
                uri = os.getenv("SCRAPER_DB_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017/srilanka_travel"
                if os.path.exists("/.dockerenv"):
                    uri = uri.replace("localhost", "mongodb").replace("127.0.0.1", "mongodb")
                try:
                    self.client = MongoClient(uri, serverSelectionTimeoutMS=5000)
                    self.client.admin.command('ping')
                    self.db = self.client.get_database()
                except Exception as conn_err:
                    logger.error(f"MongoDBClient connection failed to URI: {uri}. Error: {conn_err}")
                    self.client = None
                    self.db = None
            def close(self):
                if hasattr(self, 'client') and self.client:
                    self.client.close()
    except Exception:
        class MongoDBClient:
            def __init__(self):
                self.client = None
                self.db = None
            def close(self):
                pass

# Global in-memory model cache for high-performance search responses
_MODEL_CACHE: Optional[Any] = None

def get_model() -> Any:
    """
    Returns the cached SentenceTransformer model instance if available.
    """
    global _MODEL_CACHE
    if _MODEL_CACHE is None:
        try:
            logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2' into memory cache...")
            st_mod = importlib.import_module("sentence_transformers")
            SentenceTransformer = st_mod.SentenceTransformer
            _MODEL_CACHE = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer model ({e}). Falling back to zero-vector similarity.")
            _MODEL_CACHE = False
    return _MODEL_CACHE if _MODEL_CACHE is not False else None


def compute_cosine_similarity(query_embedding: np.ndarray, doc_embedding: Any) -> float:
    """
    Computes cosine similarity between query embedding vector and document embedding vector.
    """
    if doc_embedding is None or not isinstance(doc_embedding, (list, np.ndarray)) or len(doc_embedding) != 384:
        return 0.0
    doc_vec = np.array(doc_embedding, dtype=np.float32)
    norm_q = float(np.linalg.norm(query_embedding))
    norm_d = float(np.linalg.norm(doc_vec))
    if norm_q == 0.0 or norm_d == 0.0:
        return 0.0
    similarity = float(np.dot(query_embedding, doc_vec) / (norm_q * norm_d))
    return similarity


REGION_ALIASES = {
    "sigiriya": ["sigiriya", "dambulla", "matale", "inagaluwa", "habarana"],
    "yala": ["yala", "tissamaharama", "kataragama", "kirinda"],
    "bentota": ["bentota", "beruwala", "induruwa", "aluthgama"],
    "ella": ["ella", "demodara", "bandarawela", "badulla"],
    "mirissa": ["mirissa", "weligama", "kamburugamuwa", "matara"],
    "galle": ["galle", "unawatuna", "ahangama", "hikkaduwa"],
    "nuwara eliya": ["nuwara eliya", "nuwaraeliya", "nanu oya", "pundaluoya", "hatton", "little england"],
    "nuwaraeliya": ["nuwara eliya", "nuwaraeliya", "nanu oya", "pundaluoya", "hatton", "little england"],
    "kandy": ["kandy", "peradeniya", "katugastota", "digana"],
    "colombo": ["colombo", "mount lavinia", "dehiwala", "negombo"]
}


def is_city_match(doc: dict, target_dest: str) -> bool:
    """
    Strict location matcher preventing cross-city leakage while accounting for regional sub-town aliases.
    """
    if not target_dest:
        return True
        
    target_lower = target_dest.strip().lower()
    doc_city = (doc.get("city") or "").strip().lower()
    doc_district = (doc.get("district") or "").strip().lower()
    doc_address = (doc.get("address") or "").strip().lower()
    doc_name = (doc.get("name") or "").strip().lower()

    allowed_terms = REGION_ALIASES.get(target_lower, [target_lower])

    # Rule 1: If doc_city is explicitly defined
    if doc_city:
        return any(term in doc_city for term in allowed_terms)

    # Rule 2: Check district if defined
    if doc_district:
        return any(term in doc_district for term in allowed_terms)

    # Rule 3: Check name or address only if city and district are not set
    if any(term in doc_name for term in allowed_terms):
        return True
    if any(term in doc_address for term in allowed_terms):
        return True

    return False


DESTINATION_FALLBACK_POIS = {
    "kandy": [
        {
            "id": "kandy-tooth-relic",
            "source_id": "kandy-tooth-relic",
            "name": "Temple of the Sacred Tooth Relic (Sri Dalada Maligawa)",
            "city": "Kandy",
            "address": "Royal Palace Complex, Kandy",
            "rating": 4.9,
            "review_count": 1420,
            "popularity_index": 0.98,
            "categories": ["Culture", "UNESCO Heritage", "Temple"],
            "airport_distance_km": 105.0,
            "airport_travel_time_min": 150.0,
            "description": "Sri Lanka's most sacred Buddhist temple housing the sacred tooth relic of Lord Buddha.",
            "images": ["/maliga.png"],
            "ticket_price_usd": 15.0
        },
        {
            "id": "kandy-peradeniya-gardens",
            "source_id": "kandy-peradeniya-gardens",
            "name": "Royal Botanical Gardens Peradeniya",
            "city": "Kandy",
            "address": "Peradeniya Road, Kandy",
            "rating": 4.8,
            "review_count": 980,
            "popularity_index": 0.92,
            "categories": ["Nature", "Gardens", "Park"],
            "airport_distance_km": 100.0,
            "airport_travel_time_min": 140.0,
            "description": "Renowned botanical garden famous for its collection of orchids, giant bamboo, and palm avenues.",
            "images": ["/sri3.png"],
            "ticket_price_usd": 10.0
        }
    ],
    "yala": [
        {
            "id": "yala-national-park-safari",
            "source_id": "yala-national-park-safari",
            "name": "Yala National Park Wildlife Safari",
            "city": "Yala",
            "address": "Yala Sanctuary, Tissamaharama",
            "rating": 4.9,
            "review_count": 2100,
            "popularity_index": 0.99,
            "categories": ["Wildlife", "Safari", "National Park"],
            "airport_distance_km": 240.0,
            "airport_travel_time_min": 240.0,
            "description": "Famous wildlife park renowned for having one of the highest leopard densities in the world.",
            "images": ["/chita.png"],
            "ticket_price_usd": 35.0
        },
        {
            "id": "yala-sithulpawwa-temple",
            "source_id": "yala-sithulpawwa-temple",
            "name": "Sithulpawwa Rock Temple",
            "city": "Yala",
            "address": "Yala National Park Complex",
            "rating": 4.7,
            "review_count": 450,
            "popularity_index": 0.85,
            "categories": ["History", "Rock Temple", "Culture"],
            "airport_distance_km": 245.0,
            "airport_travel_time_min": 250.0,
            "description": "Ancient 2nd-century BC monastic complex built on massive rock formations deep within Yala.",
            "images": ["/pilima.png"],
            "ticket_price_usd": 5.0
        }
    ],
    "galle": [
        {
            "id": "galle-dutch-fort",
            "source_id": "galle-dutch-fort",
            "name": "Historic Galle Dutch Fort & Lighthouse",
            "city": "Galle",
            "address": "Church Street, Galle Fort",
            "rating": 4.9,
            "review_count": 3100,
            "popularity_index": 0.98,
            "categories": ["UNESCO Heritage", "History", "Fort"],
            "airport_distance_km": 150.0,
            "airport_travel_time_min": 130.0,
            "description": "UNESCO World Heritage Site featuring 16th-century Portuguese and Dutch colonial ramparts.",
            "images": ["/images/galle.png"],
            "ticket_price_usd": 0.0
        },
        {
            "id": "galle-unawatuna-beach",
            "source_id": "galle-unawatuna-beach",
            "name": "Unawatuna Beach & Jungle Beach",
            "city": "Galle",
            "address": "Unawatuna Bay, Galle",
            "rating": 4.8,
            "review_count": 1850,
            "popularity_index": 0.94,
            "categories": ["Beach", "Nature", "Water Sports"],
            "airport_distance_km": 152.0,
            "airport_travel_time_min": 135.0,
            "description": "Picturesque golden horseshoe bay famous for calm turquoise waters, coral reefs, and beach cafes.",
            "images": ["/miris.png"],
            "ticket_price_usd": 0.0
        }
    ],
    "sigiriya": [
        {
            "id": "sigiriya-rock-fortress",
            "source_id": "sigiriya-rock-fortress",
            "name": "Sigiriya Ancient Rock Fortress",
            "city": "Sigiriya",
            "address": "Sigiriya Road, Dambulla",
            "rating": 5.0,
            "review_count": 5200,
            "popularity_index": 1.0,
            "categories": ["UNESCO Heritage", "Archaeology", "History"],
            "airport_distance_km": 145.0,
            "airport_travel_time_min": 180.0,
            "description": "World-famous 5th-century ancient citadel perched atop a 200-meter sheer granite peak.",
            "images": ["/sigiri.png"],
            "ticket_price_usd": 30.0
        }
    ],
    "dambulla": [
        {
            "id": "dambulla-cave-temple",
            "source_id": "dambulla-cave-temple",
            "name": "Dambulla Royal Cave Temple & Golden Temple",
            "city": "Dambulla",
            "address": "Kandy-Jaffna Highway, Dambulla",
            "rating": 4.8,
            "review_count": 2800,
            "popularity_index": 0.96,
            "categories": ["UNESCO Heritage", "Cave Temple", "Culture"],
            "airport_distance_km": 130.0,
            "airport_travel_time_min": 160.0,
            "description": "Best-preserved cave temple complex in Sri Lanka featuring 153 Buddha statues and ancient murals.",
            "images": ["/pilima.png"],
            "ticket_price_usd": 12.0
        }
    ],
    "ella": [
        {
            "id": "ella-nine-arch-bridge",
            "source_id": "ella-nine-arch-bridge",
            "name": "Demodara Nine Arch Bridge",
            "city": "Ella",
            "address": "Gotuwala, Ella",
            "rating": 4.9,
            "review_count": 3400,
            "popularity_index": 0.97,
            "categories": ["Scenery", "Architecture", "Photography"],
            "airport_distance_km": 200.0,
            "airport_travel_time_min": 210.0,
            "description": "Iconic colonial-era viaduct bridge surrounded by lush green tea hills and cloud forests.",
            "images": ["/ella.png"],
            "ticket_price_usd": 0.0
        }
    ],
    "nuwara eliya": [
        {
            "id": "nuwara-eliya-tea-factory",
            "source_id": "nuwara-eliya-tea-factory",
            "name": "Ceylon Tea Plantation & Pedro Tea Estate",
            "city": "Nuwara Eliya",
            "address": "Grand Hotel Road, Nuwara Eliya",
            "rating": 4.8,
            "review_count": 1600,
            "popularity_index": 0.93,
            "categories": ["Tea Estate", "Scenery", "Heritage"],
            "airport_distance_km": 155.0,
            "airport_travel_time_min": 190.0,
            "description": "High-altitude tea plantation tour demonstrating the authentic process of crafting Ceylon Tea.",
            "images": ["/tea.png"],
            "ticket_price_usd": 5.0
        },
        {
            "id": "nuwara-eliya-gregory-lake",
            "source_id": "nuwara-eliya-gregory-lake",
            "name": "Lake Gregory Leisure Park & Promenade",
            "city": "Nuwara Eliya",
            "address": "Badulla Road, Nuwara Eliya",
            "rating": 4.7,
            "review_count": 1850,
            "popularity_index": 0.95,
            "categories": ["Lake", "Recreation", "Boating"],
            "airport_distance_km": 156.0,
            "airport_travel_time_min": 192.0,
            "description": "Scenic colonial mountain lake offering swan pedal boats, jet skis, pony rides, and waterfront dining.",
            "images": ["/images/tea.png"],
            "ticket_price_usd": 3.0
        },
        {
            "id": "nuwara-eliya-horton-plains",
            "source_id": "nuwara-eliya-horton-plains",
            "name": "Horton Plains National Park & World's End",
            "city": "Nuwara Eliya",
            "address": "Ohiya, Central Highlands",
            "rating": 4.9,
            "review_count": 2900,
            "popularity_index": 0.98,
            "categories": ["Trekking", "National Park", "Viewpoint"],
            "airport_distance_km": 170.0,
            "airport_travel_time_min": 210.0,
            "description": "Cloud forest nature reserve featuring the sheer 880m World's End drop and Baker's Falls.",
            "images": ["/images/nine_arch.png"],
            "ticket_price_usd": 30.0
        }
    ],
    "nuwaraeliya": [
        {
            "id": "nuwara-eliya-tea-factory",
            "source_id": "nuwara-eliya-tea-factory",
            "name": "Ceylon Tea Plantation & Pedro Tea Estate",
            "city": "Nuwara Eliya",
            "address": "Grand Hotel Road, Nuwara Eliya",
            "rating": 4.8,
            "review_count": 1600,
            "popularity_index": 0.93,
            "categories": ["Tea Estate", "Scenery", "Heritage"],
            "airport_distance_km": 155.0,
            "airport_travel_time_min": 190.0,
            "description": "High-altitude tea plantation tour demonstrating the authentic process of crafting Ceylon Tea.",
            "images": ["/tea.png"],
            "ticket_price_usd": 5.0
        },
        {
            "id": "nuwara-eliya-gregory-lake",
            "source_id": "nuwara-eliya-gregory-lake",
            "name": "Lake Gregory Leisure Park & Promenade",
            "city": "Nuwara Eliya",
            "address": "Badulla Road, Nuwara Eliya",
            "rating": 4.7,
            "review_count": 1850,
            "popularity_index": 0.95,
            "categories": ["Lake", "Recreation", "Boating"],
            "airport_distance_km": 156.0,
            "airport_travel_time_min": 192.0,
            "description": "Scenic colonial mountain lake offering swan pedal boats, jet skis, pony rides, and waterfront dining.",
            "images": ["/images/tea.png"],
            "ticket_price_usd": 3.0
        }
    ],
    "bentota": [
        {
            "id": "bentota-beach-watersports",
            "source_id": "bentota-beach-watersports",
            "name": "Bentota River Safari & Golden Beach",
            "city": "Bentota",
            "address": "Bentota Coastal Strip, Bentota",
            "rating": 4.8,
            "review_count": 1400,
            "popularity_index": 0.91,
            "categories": ["Beach", "Water Sports", "River Safari"],
            "airport_distance_km": 110.0,
            "airport_travel_time_min": 90.0,
            "description": "Prime coastal paradise for jet-skiing, boat safaris along the Madu Ganga mangrove lagoon, and relaxing.",
            "images": ["/images/bentota.png"],
            "ticket_price_usd": 15.0
        }
    ]
}

DESTINATION_FALLBACK_HOTELS: Dict[str, List[Dict[str, Any]]] = {
    "nuwara eliya": [
        {
            "id": "heritance-tea-factory",
            "source_id": "heritance-tea-factory",
            "name": "Heritance Tea Factory Resort & Spa",
            "city": "Nuwara Eliya",
            "star_rating": 5,
            "rating": 4.9,
            "review_count": 1420,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 145.0,
            "description": "5-star luxury heritage resort converted from an authentic 19th-century tea factory perched high in the misty cloud forest.",
            "images": ["/images/tea.png"]
        },
        {
            "id": "grand-hotel-nuwara-eliya",
            "source_id": "grand-hotel-nuwara-eliya",
            "name": "The Grand Hotel Nuwara Eliya & Heritage Colonial Estate",
            "city": "Nuwara Eliya",
            "star_rating": 4,
            "rating": 4.8,
            "review_count": 2100,
            "price_tier": "4-Star Heritage",
            "avg_nightly_usd": 85.0,
            "description": "Historic 4-star colonial heritage hotel set amidst award-winning manicured English gardens, tea lounges, and billiards.",
            "images": ["/images/tea.png"]
        },
        {
            "id": "araliya-green-hills",
            "source_id": "araliya-green-hills",
            "name": "Araliya Green Hills Hotel",
            "city": "Nuwara Eliya",
            "star_rating": 4,
            "rating": 4.7,
            "review_count": 890,
            "price_tier": "4-Star Premium",
            "avg_nightly_usd": 75.0,
            "description": "Modern 4-star hotel in the heart of town with heated indoor pool, wellness spa, and panoramic highland views.",
            "images": ["/images/tea.png"]
        },
        {
            "id": "alpine-hotel-gregory",
            "source_id": "alpine-hotel-gregory",
            "name": "Alpine Hotel & Lake Gregory Inn",
            "city": "Nuwara Eliya",
            "star_rating": 3,
            "rating": 4.5,
            "review_count": 450,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 35.0,
            "description": "Charming budget lakeside hotel within walking distance of Lake Gregory, boat rentals, and strawberry cafes.",
            "images": ["/images/tea.png"]
        },
        {
            "id": "little-england-budget-cottages",
            "source_id": "little-england-budget-cottages",
            "name": "Little England Cottages & Backpacker Hostel",
            "city": "Nuwara Eliya",
            "star_rating": 3,
            "rating": 4.4,
            "review_count": 320,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 24.0,
            "description": "Cozy budget guesthouse offering warm mountain hospitality, hot water, fireplace lounge, and backpacker rates.",
            "images": ["/images/tea.png"]
        }
    ],
    "nuwaraeliya": [
        {
            "id": "heritance-tea-factory",
            "source_id": "heritance-tea-factory",
            "name": "Heritance Tea Factory Resort & Spa",
            "city": "Nuwara Eliya",
            "star_rating": 5,
            "rating": 4.9,
            "review_count": 1420,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 145.0,
            "description": "5-star luxury heritage resort converted from an authentic 19th-century tea factory perched high in the misty cloud forest.",
            "images": ["/images/tea.png"]
        },
        {
            "id": "grand-hotel-nuwara-eliya",
            "source_id": "grand-hotel-nuwara-eliya",
            "name": "The Grand Hotel Nuwara Eliya & Heritage Colonial Estate",
            "city": "Nuwara Eliya",
            "star_rating": 4,
            "rating": 4.8,
            "review_count": 2100,
            "price_tier": "4-Star Heritage",
            "avg_nightly_usd": 85.0,
            "description": "Historic 4-star colonial heritage hotel set amidst award-winning manicured English gardens, tea lounges, and billiards.",
            "images": ["/images/tea.png"]
        },
        {
            "id": "araliya-green-hills",
            "source_id": "araliya-green-hills",
            "name": "Araliya Green Hills Hotel",
            "city": "Nuwara Eliya",
            "star_rating": 4,
            "rating": 4.7,
            "review_count": 890,
            "price_tier": "4-Star Premium",
            "avg_nightly_usd": 75.0,
            "description": "Modern 4-star hotel in the heart of town with heated indoor pool, wellness spa, and panoramic highland views.",
            "images": ["/images/tea.png"]
        },
        {
            "id": "alpine-hotel-gregory",
            "source_id": "alpine-hotel-gregory",
            "name": "Alpine Hotel & Lake Gregory Inn",
            "city": "Nuwara Eliya",
            "star_rating": 3,
            "rating": 4.5,
            "review_count": 450,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 35.0,
            "description": "Charming budget lakeside hotel within walking distance of Lake Gregory, boat rentals, and strawberry cafes.",
            "images": ["/images/tea.png"]
        },
        {
            "id": "little-england-budget-cottages",
            "source_id": "little-england-budget-cottages",
            "name": "Little England Cottages & Backpacker Hostel",
            "city": "Nuwara Eliya",
            "star_rating": 3,
            "rating": 4.4,
            "review_count": 320,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 24.0,
            "description": "Cozy budget guesthouse offering warm mountain hospitality, hot water, fireplace lounge, and backpacker rates.",
            "images": ["/images/tea.png"]
        }
    ],
    "kandy": [
        {
            "id": "golden-crown-kandy",
            "source_id": "golden-crown-kandy",
            "name": "The Golden Crown Hotel Kandy",
            "city": "Kandy",
            "star_rating": 5,
            "rating": 4.9,
            "review_count": 1850,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 130.0,
            "description": "Lavish 5-star resort boasting infinity mountain pools, fine dining, and panoramic vistas across Ampitiya hills.",
            "images": ["/images/kandy.png"]
        },
        {
            "id": "earls-regency-kandy",
            "source_id": "earls-regency-kandy",
            "name": "Earl's Regency Kandy Luxury Resort",
            "city": "Kandy",
            "star_rating": 5,
            "rating": 4.8,
            "review_count": 2200,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 110.0,
            "description": "5-star hillside resort perched above the Mahaweli River with scenic gardens and Kandyan architecture.",
            "images": ["/images/kandy.png"]
        },
        {
            "id": "grand-kandyan-hotel",
            "source_id": "grand-kandyan-hotel",
            "name": "The Grand Kandyan Hotel",
            "city": "Kandy",
            "star_rating": 4,
            "rating": 4.7,
            "review_count": 1150,
            "price_tier": "4-Star Premium",
            "avg_nightly_usd": 70.0,
            "description": "Elegant 4-star city stay with rooftop views of Kandy Lake and proximity to the Temple of the Sacred Tooth Relic.",
            "images": ["/images/kandy.png"]
        },
        {
            "id": "thilanka-hotel-kandy",
            "source_id": "thilanka-hotel-kandy",
            "name": "Hotel Thilanka Kandy Lakeview",
            "city": "Kandy",
            "star_rating": 4,
            "rating": 4.6,
            "review_count": 980,
            "price_tier": "4-Star Standard",
            "avg_nightly_usd": 55.0,
            "description": "Tranquil 4-star hotel overlooking Udawatta Kele nature sanctuary and Kandy Lake.",
            "images": ["/images/kandy.png"]
        },
        {
            "id": "kandy-city-budget-inn",
            "source_id": "kandy-city-budget-inn",
            "name": "Kandy City Stay & Riverside Budget Inn",
            "city": "Kandy",
            "star_rating": 3,
            "rating": 4.5,
            "review_count": 520,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 28.0,
            "description": "Clean, highly rated budget hotel offering air conditioning, Ceylon breakfast, and easy tuk-tuk access to town.",
            "images": ["/images/kandy.png"]
        }
    ],
    "colombo": [
        {
            "id": "the-kingsbury-colombo",
            "source_id": "the-kingsbury-colombo",
            "name": "The Kingsbury Colombo & Ocean Suites",
            "city": "Colombo",
            "star_rating": 5,
            "rating": 4.9,
            "review_count": 3100,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 150.0,
            "description": "Iconic 5-star luxury oceanfront hotel on Marine Drive with rooftop sky bar and harbour views.",
            "images": ["/images/colombo.png"]
        },
        {
            "id": "cinnamon-grand-colombo",
            "source_id": "cinnamon-grand-colombo",
            "name": "Cinnamon Grand Colombo",
            "city": "Colombo",
            "star_rating": 5,
            "rating": 4.8,
            "review_count": 4200,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 135.0,
            "description": "Grand 5-star city resort offering 14 specialized restaurants, 2 outdoor swimming pools, and shopping arcade.",
            "images": ["/images/colombo.png"]
        },
        {
            "id": "fairway-colombo",
            "source_id": "fairway-colombo",
            "name": "Fairway Colombo Fort",
            "city": "Colombo",
            "star_rating": 4,
            "rating": 4.7,
            "review_count": 1600,
            "price_tier": "4-Star Premium",
            "avg_nightly_usd": 65.0,
            "description": "Trendy 4-star hotel in Colombo's historic Dutch Hospital precinct, surrounded by boutique cafes and vibrant nightlife.",
            "images": ["/images/colombo.png"]
        },
        {
            "id": "cinnamon-red-colombo",
            "source_id": "cinnamon-red-colombo",
            "name": "Cinnamon Red Colombo Lean Luxury",
            "city": "Colombo",
            "star_rating": 3,
            "rating": 4.6,
            "review_count": 2800,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 48.0,
            "description": "Modern 3-star design hotel featuring rooftop infinity pool, skyline lounge, and comfortable smart rooms.",
            "images": ["/images/colombo.png"]
        },
        {
            "id": "city-rest-fort-colombo",
            "source_id": "city-rest-fort-colombo",
            "name": "City Rest Fort Backpacker Stay",
            "city": "Colombo",
            "star_rating": 3,
            "rating": 4.4,
            "review_count": 780,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 22.0,
            "description": "Convenient budget hotel in Central Colombo Fort near the railway station with fast Wi-Fi and air-conditioned rooms.",
            "images": ["/images/colombo.png"]
        }
    ],
    "galle": [
        {
            "id": "amangalla-galle-fort",
            "source_id": "amangalla-galle-fort",
            "name": "Amangalla Historic Luxury Resort",
            "city": "Galle",
            "star_rating": 5,
            "rating": 5.0,
            "review_count": 1200,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 210.0,
            "description": "Ultra-exclusive 5-star colonial sanctuary inside the UNESCO Galle Fort ramparts dating back to 1684.",
            "images": ["/images/galle.png"]
        },
        {
            "id": "le-grand-galle",
            "source_id": "le-grand-galle",
            "name": "Le Grand Galle by Asia Leisure",
            "city": "Galle",
            "star_rating": 5,
            "rating": 4.8,
            "review_count": 1450,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 140.0,
            "description": "5-star luxury seaside resort with unobstructed views of the UNESCO World Heritage Galle Fort and ocean waves.",
            "images": ["/images/galle.png"]
        },
        {
            "id": "the-fort-printers-galle",
            "source_id": "the-fort-printers-galle",
            "name": "The Fort Printers Heritage Hotel",
            "city": "Galle",
            "star_rating": 4,
            "rating": 4.7,
            "review_count": 820,
            "price_tier": "4-Star Heritage",
            "avg_nightly_usd": 85.0,
            "description": "Restored 18th-century 4-star boutique mansion with private courtyard pool and acclaimed Mediterranean seafood dining.",
            "images": ["/images/galle.png"]
        },
        {
            "id": "closenberg-hotel-galle",
            "source_id": "closenberg-hotel-galle",
            "name": "Closenberg Hotel & Bay View",
            "city": "Galle",
            "star_rating": 3,
            "rating": 4.6,
            "review_count": 650,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 42.0,
            "description": "Historic colonial peninsula stay with panoramic views of Galle Bay, harbor breezes, and cozy vintage rooms.",
            "images": ["/images/galle.png"]
        },
        {
            "id": "galle-fort-budget-haven",
            "source_id": "galle-fort-budget-haven",
            "name": "Galle Fort Budget Haven & Hostel",
            "city": "Galle",
            "star_rating": 3,
            "rating": 4.3,
            "review_count": 410,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 24.0,
            "description": "Affordable budget guesthouse within walking distance of Galle Lighthouse, rampart sunsets, and gelato shops.",
            "images": ["/images/galle.png"]
        }
    ],
    "ella": [
        {
            "id": "98-acres-resort-ella",
            "source_id": "98-acres-resort-ella",
            "name": "98 Acres Resort & Spa Ella",
            "city": "Ella",
            "star_rating": 5,
            "rating": 4.9,
            "review_count": 3100,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 160.0,
            "description": "World-famous 5-star eco-luxury resort built on a 98-acre scenic tea estate facing Ella Rock and Little Adam's Peak.",
            "images": ["/ella.png"]
        },
        {
            "id": "ella-mountain-heaven",
            "source_id": "ella-mountain-heaven",
            "name": "Ella Mountain Heaven Resort",
            "city": "Ella",
            "star_rating": 4,
            "rating": 4.7,
            "review_count": 1200,
            "price_tier": "4-Star Premium",
            "avg_nightly_usd": 75.0,
            "description": "Spectacular 4-star mountain lodge featuring private cliffside balconies overlooking the famous Ella Gap.",
            "images": ["/ella.png"]
        },
        {
            "id": "zion-view-ella",
            "source_id": "zion-view-ella",
            "name": "Zion View Mountain Experience",
            "city": "Ella",
            "star_rating": 4,
            "rating": 4.6,
            "review_count": 940,
            "price_tier": "4-Star Standard",
            "avg_nightly_usd": 60.0,
            "description": "Relaxing 4-star mountain retreat with yoga decks, infinity mountain views, and hearty Sri Lankan breakfast curries.",
            "images": ["/ella.png"]
        },
        {
            "id": "ella-ecolodge",
            "source_id": "ella-ecolodge",
            "name": "Ella Ecolodge & Nature Stay",
            "city": "Ella",
            "star_rating": 3,
            "rating": 4.5,
            "review_count": 620,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 32.0,
            "description": "Treehouse-style budget accommodation surrounded by birds and jungle flora, 5 minutes from Ella train station.",
            "images": ["/ella.png"]
        },
        {
            "id": "little-adams-hostel-ella",
            "source_id": "little-adams-hostel-ella",
            "name": "Little Adam's Backpacker Hostel & Cafe",
            "city": "Ella",
            "star_rating": 3,
            "rating": 4.4,
            "review_count": 480,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 18.0,
            "description": "Fun, welcoming budget hostel popular with hikers, solo travelers, and backpackers exploring the Nine Arch Bridge.",
            "images": ["/ella.png"]
        }
    ],
    "sigiriya": [
        {
            "id": "water-garden-sigiriya",
            "source_id": "water-garden-sigiriya",
            "name": "Water Garden Sigiriya Luxury Villas",
            "city": "Sigiriya",
            "star_rating": 5,
            "rating": 4.9,
            "review_count": 980,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 175.0,
            "description": "Luxurious 5-star private pool villas surrounded by waterways, lotus ponds, and direct sightlines of Sigiriya Rock.",
            "images": ["/sigiri.png"]
        },
        {
            "id": "aliya-resort-sigiriya",
            "source_id": "aliya-resort-sigiriya",
            "name": "Aliya Resort & Spa Sigiriya",
            "city": "Sigiriya",
            "star_rating": 4,
            "rating": 4.8,
            "review_count": 1800,
            "price_tier": "4-Star Premium",
            "avg_nightly_usd": 85.0,
            "description": "Themed 4-star resort celebrating the Sri Lankan elephant, featuring infinity pool facing the ancient fortress.",
            "images": ["/sigiri.png"]
        },
        {
            "id": "hotel-sigiriya",
            "source_id": "hotel-sigiriya",
            "name": "Hotel Sigiriya (Rock View Resort)",
            "city": "Sigiriya",
            "star_rating": 4,
            "rating": 4.7,
            "review_count": 1500,
            "price_tier": "4-Star Standard",
            "avg_nightly_usd": 65.0,
            "description": "Established 4-star nature resort offering the closest pool-side views of the 5th-century rock citadel.",
            "images": ["/sigiri.png"]
        },
        {
            "id": "sigiriya-village-cottages",
            "source_id": "sigiriya-village-cottages",
            "name": "Sigiriya Village Cottages",
            "city": "Sigiriya",
            "star_rating": 3,
            "rating": 4.5,
            "review_count": 720,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 38.0,
            "description": "Charming village-style chalets set in tranquil woodlands with bird watching and authentic buffet spreads.",
            "images": ["/sigiri.png"]
        },
        {
            "id": "lions-rock-budget-stay",
            "source_id": "lions-rock-budget-stay",
            "name": "Lion's Rock Budget Homestay & B&B",
            "city": "Sigiriya",
            "star_rating": 3,
            "rating": 4.3,
            "review_count": 390,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 20.0,
            "description": "Friendly local homestay offering clean rooms, home-cooked rice and curry, and bicycle rentals to Pidurangala.",
            "images": ["/sigiri.png"]
        }
    ],
    "yala": [
        {
            "id": "chena-huts-yala",
            "source_id": "chena-huts-yala",
            "name": "Chena Huts by Uga Escapes Yala",
            "city": "Yala",
            "star_rating": 5,
            "rating": 5.0,
            "review_count": 750,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 240.0,
            "description": "All-inclusive ultra-luxury 5-star safari pavilions with private plunge pools where jungle meets the Indian Ocean.",
            "images": ["/chita.png"]
        },
        {
            "id": "jetwing-yala",
            "source_id": "jetwing-yala",
            "name": "Jetwing Yala Safari Resort",
            "city": "Yala",
            "star_rating": 5,
            "rating": 4.8,
            "review_count": 1650,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 150.0,
            "description": "Beachside 5-star wildlife sanctuary hotel near the Katagamuwa entrance with huge pool and leopard safaris.",
            "images": ["/chita.png"]
        },
        {
            "id": "cinnamon-wild-yala",
            "source_id": "cinnamon-wild-yala",
            "name": "Cinnamon Wild Yala Safari Lodge",
            "city": "Yala",
            "star_rating": 4,
            "rating": 4.7,
            "review_count": 1900,
            "price_tier": "4-Star Premium",
            "avg_nightly_usd": 95.0,
            "description": "Rustic 4-star chalets positioned beside a natural crocodile lake directly bordering the Yala National Park buffer zone.",
            "images": ["/chita.png"]
        },
        {
            "id": "big-game-camp-yala",
            "source_id": "big-game-camp-yala",
            "name": "Big Game Tented Safari Camp Yala",
            "city": "Yala",
            "star_rating": 3,
            "rating": 4.5,
            "review_count": 510,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 50.0,
            "description": "Authentic semi-luxury tented safari camp offering campfire dinners, wildlife guides, and dawn game drives.",
            "images": ["/chita.png"]
        },
        {
            "id": "yala-safari-budget-lodge",
            "source_id": "yala-safari-budget-lodge",
            "name": "Yala Safari Budget Lodge & Guest Inn",
            "city": "Yala",
            "star_rating": 3,
            "rating": 4.4,
            "review_count": 380,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 26.0,
            "description": "Affordable safari basecamp in Tissamaharama providing budget private jeep packages and clean AC rooms.",
            "images": ["/chita.png"]
        }
    ],
    "bentota": [
        {
            "id": "taj-bentota-resort",
            "source_id": "taj-bentota-resort",
            "name": "Taj Bentota Resort & Spa",
            "city": "Bentota",
            "star_rating": 5,
            "rating": 4.9,
            "review_count": 2400,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 165.0,
            "description": "World-class 5-star Taj luxury beach resort perched on a rocky headland overlooking golden southern beaches.",
            "images": ["/images/bentota.png"]
        },
        {
            "id": "cinnamon-bentota-beach",
            "source_id": "cinnamon-bentota-beach",
            "name": "Cinnamon Bentota Beach Resort",
            "city": "Bentota",
            "star_rating": 5,
            "rating": 4.8,
            "review_count": 1950,
            "price_tier": "5-Star Luxury",
            "avg_nightly_usd": 145.0,
            "description": "Architect Geoffrey Bawa inspired 5-star beachfront haven between the Indian Ocean and the Bentota River.",
            "images": ["/images/bentota.png"]
        },
        {
            "id": "centara-ceysands-bentota",
            "source_id": "centara-ceysands-bentota",
            "name": "Centara Ceysands Resort & Spa",
            "city": "Bentota",
            "star_rating": 4,
            "rating": 4.7,
            "review_count": 1300,
            "price_tier": "4-Star Premium",
            "avg_nightly_usd": 75.0,
            "description": "Island peninsula 4-star resort reached by short boat ferry, offering watersports, river safaris, and lagoon pool.",
            "images": ["/images/bentota.png"]
        },
        {
            "id": "marina-bentota-riverfront",
            "source_id": "marina-bentota-riverfront",
            "name": "Marina Bentota Riverfront Stay",
            "city": "Bentota",
            "star_rating": 3,
            "rating": 4.5,
            "review_count": 480,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 40.0,
            "description": "Scenic 3-star riverfront hotel offering watersports packages, jet ski rentals, and tranquil mangrove views.",
            "images": ["/images/bentota.png"]
        },
        {
            "id": "bentota-beach-budget-inn",
            "source_id": "bentota-beach-budget-inn",
            "name": "Bentota Beachside Budget Inn",
            "city": "Bentota",
            "star_rating": 3,
            "rating": 4.4,
            "review_count": 310,
            "price_tier": "Budget / 3-Star",
            "avg_nightly_usd": 25.0,
            "description": "Family-run budget guesthouse 200m from the golden beach, offering friendly hosts and fresh seafood breakfasts.",
            "images": ["/images/bentota.png"]
        }
    ]
}


def search_travel_database(
    destination: str,
    budget_tier: Optional[str] = None,
    vibe_query: Optional[str] = None,
    selected_place_ids: Optional[List[str]] = None,
    limit: int = 5
) -> str:
    """
    Queries MongoDB for hotels and POIs matching the destination, budget tier, and vibe embedding similarity.

    Args:
        destination (str): Primary target destination (e.g., 'Colombo', 'Kandy', 'Galle', 'Yala').
        budget_tier (str, optional): 'Budget', 'Standard', or 'Luxury'. Filters hotel price tiers and rates.
        vibe_query (str, optional): Natural language travel preferences vector encoded for semantic matching.
        selected_place_ids (list, optional): List of specific source_ids or document _ids to prioritize at top of results.
        limit (int): Maximum number of records to return (defaults to 5).

    Returns:
        str: JSON formatted payload containing top matching Hotels (up to 3) and POIs (up to 5).
    """
    logger.info(f"Executing hybrid search query: destination='{destination}', budget_tier='{budget_tier}', vibe='{vibe_query}'")
    mongo = MongoDBClient()

    if mongo.db is None:
        logger.error("Database connection unavailable for search query.")
        return json.dumps({"error": "Database connection unavailable", "hotels": [], "poi": []}, indent=2)

    model = get_model()
    
    # Compose search string and generate query vector embedding
    search_prompt = f"{destination} {vibe_query}".strip() if vibe_query else destination
    if model is not None:
        try:
            query_vec = model.encode(search_prompt, show_progress_bar=False)
            query_vec = np.array(query_vec, dtype=np.float32)
        except Exception:
            query_vec = np.zeros(384, dtype=np.float32)
    else:
        query_vec = np.zeros(384, dtype=np.float32)

    selected_ids_set = set(selected_place_ids) if selected_place_ids else set()

    # Destination regex filter
    dest_pattern = re.compile(re.escape(destination.strip()), re.I) if destination else None

    # Base query requiring vector embeddings
    base_filter = {"$or": [{"embedding_ready": True}, {"embedding": {"$exists": True, "$not": {"$size": 0}}}]}

    # ==========================================
    # 1. SEARCH HOTELS COLLECTION
    # ==========================================
    hotel_query = dict(base_filter)
    tier_lower = budget_tier.strip().lower() if budget_tier else None

    if tier_lower in ["budget", "3-star", "3 star"]:
        hotel_query["$or"] = [
            {"price_tier": {"$regex": "^Budget$", "$options": "i"}},
            {"avg_nightly": {"$lt": 50.0}},
            {"star_rating": {"$lte": 3}}
        ]
        # Strictly exclude luxury or 5-star hotels when user suggests budget
        hotel_query["price_tier"] = {"$not": {"$regex": "luxury|5-star", "$options": "i"}}
    elif tier_lower in ["luxury", "5-star", "5 star"]:
        hotel_query["$or"] = [
            {"price_tier": {"$regex": "Luxury|5-Star", "$options": "i"}},
            {"avg_nightly": {"$gte": 110.0}},
            {"star_rating": 5}
        ]
    elif tier_lower in ["standard", "4-star", "4 star"]:
        hotel_query["$or"] = [
            {"price_tier": {"$regex": "Standard|4-Star", "$options": "i"}},
            {"avg_nightly": {"$gte": 50.0, "$lte": 110.0}},
            {"star_rating": 4}
        ]
    elif budget_tier:
        hotel_query["price_tier"] = {"$regex": f"^{re.escape(budget_tier)}$", "$options": "i"}

    hotels_cursor = mongo.db["hotels"].find(hotel_query)
    all_hotels = list(hotels_cursor)

    # Filter by destination strictly checking location fields using is_city_match
    filtered_hotels = []
    if destination:
        for doc in all_hotels:
            if is_city_match(doc, destination):
                filtered_hotels.append(doc)
                
        # 5-Star Fallback Rule: If 5-star was requested but 0 hotels found in DB, fallback to 4-star hotels!
        if len(filtered_hotels) == 0 and tier_lower in ["luxury", "5-star", "5 star"]:
            logger.info(f"0 5-Star hotels found for '{destination}'. Falling back to 4-Star hotels as requested.")
            fallback_4star_query = dict(base_filter)
            fallback_4star_query["$or"] = [
                {"price_tier": {"$regex": "Standard|4-Star", "$options": "i"}},
                {"avg_nightly": {"$gte": 50.0, "$lte": 110.0}},
                {"star_rating": 4}
            ]
            for doc in mongo.db["hotels"].find(fallback_4star_query):
                if is_city_match(doc, destination):
                    filtered_hotels.append(doc)

        if len(filtered_hotels) < 3:
            logger.info(f"Strict destination match returned {len(filtered_hotels)} hotels; searching broader destination pool.")
            broader_cursor = mongo.db["hotels"].find(base_filter)
            existing_ids = {str(h.get("_id")) for h in filtered_hotels}
            for doc in broader_cursor:
                if str(doc.get("_id")) not in existing_ids:
                    if is_city_match(doc, destination):
                        # Verify strict budget rule on broader pool
                        if tier_lower in ["budget", "3-star", "3 star"]:
                            doc_tier = str(doc.get("price_tier", "")).lower()
                            if "lux" in doc_tier or "5-star" in doc_tier or (doc.get("avg_nightly") or 0) > 60:
                                continue
                        filtered_hotels.append(doc)
    else:
        filtered_hotels = all_hotels

    # Score hotels using hybrid vector similarity + selected ID boost
    scored_hotels = []
    for doc in filtered_hotels:
        sim = compute_cosine_similarity(query_vec, doc.get("embedding"))
        source_id = doc.get("source_id", "")
        doc_id = str(doc.get("_id", ""))
        
        # Boost selected place IDs (checking both source_id and MongoDB _id string)
        boost = 1.0 if (source_id in selected_ids_set or doc_id in selected_ids_set) else 0.0
        total_score = sim + boost

        room_details = []
        for r in doc.get("rooms", []):
            if isinstance(r, dict):
                room_details.append({
                    "type": r.get("type", "Standard Room"),
                    "price_per_night": r.get("price_per_night"),
                    "currency": r.get("currency", "USD"),
                    "capacity": r.get("capacity", 2)
                })

        scored_hotels.append((
            total_score,
            sim,
            {
                "id": doc_id,
                "source_id": source_id,
                "name": doc.get("name"),
                "city": doc.get("city") or destination,
                "address": doc.get("address"),
                "price_tier": doc.get("price_tier"),
                "star_rating": doc.get("star_rating") or (5 if (doc.get("avg_nightly") or 0) >= 115 else 4 if (doc.get("avg_nightly") or 0) >= 50 else 3),
                "avg_nightly_usd": doc.get("avg_nightly"),
                "rating": doc.get("rating"),
                "review_count": doc.get("review_count"),
                "room_types": room_details,
                "airport_distance_km": doc.get("airport_distance_km"),
                "airport_travel_time_min": doc.get("airport_travel_time_min"),
                "has_wifi": doc.get("has_wifi", False),
                "has_pool": doc.get("has_pool", False),
                "has_breakfast": doc.get("has_breakfast", False),
                "description": doc.get("description"),
                "images": doc.get("images", []),
                "similarity_score": round(sim, 4)
            }
        ))

    # Supplement with curated destination hotels if DB returns fewer than 3-5 hotels
    dest_key = destination.strip().lower() if destination else ""
    city_fb_hotels = []
    for key, fb_hotels in DESTINATION_FALLBACK_HOTELS.items():
        if key in dest_key or dest_key in key:
            city_fb_hotels = fb_hotels
            break

    if city_fb_hotels:
        existing_names = {item[2]["name"].lower() for item in scored_hotels}
        # Filter fallback hotels according to the budget policy
        if tier_lower in ["luxury", "5-star", "5 star"]:
            matching_fbs = [h for h in city_fb_hotels if h.get("star_rating") == 5]
            # If 5-star not available, fallback to 4-star!
            if not matching_fbs:
                matching_fbs = [h for h in city_fb_hotels if h.get("star_rating") == 4]
        elif tier_lower in ["budget", "3-star", "3 star"]:
            # Strict rule: no 5-star hotels if user suggests budget!
            matching_fbs = [h for h in city_fb_hotels if h.get("star_rating", 3) <= 3 and "5-star" not in h.get("price_tier", "").lower()]
        elif tier_lower in ["standard", "4-star", "4 star"]:
            matching_fbs = [h for h in city_fb_hotels if h.get("star_rating") == 4]
            if not matching_fbs:
                matching_fbs = city_fb_hotels
        else:
            matching_fbs = city_fb_hotels

        for fb in matching_fbs:
            if fb["name"].lower() not in existing_names and len(scored_hotels) < 5:
                scored_hotels.append((
                    0.85,
                    0.85,
                    {
                        "id": fb["id"],
                        "source_id": fb["source_id"],
                        "name": fb["name"],
                        "city": fb["city"],
                        "price_tier": fb["price_tier"],
                        "star_rating": fb.get("star_rating", 4),
                        "avg_nightly_usd": fb["avg_nightly_usd"],
                        "rating": fb["rating"],
                        "review_count": fb["review_count"],
                        "description": fb["description"],
                        "images": fb["images"],
                        "similarity_score": 0.85
                    }
                ))

    # Sort hotels by total score descending
    scored_hotels.sort(key=lambda x: x[0], reverse=True)
    # Return minimum 3-5 hotels based on availability
    top_hotels = [item[2] for item in scored_hotels[:min(5, max(3, limit))]]

    # ==========================================
    # 2. SEARCH POI COLLECTION
    # ==========================================
    poi_cursor = mongo.db["poi"].find(base_filter)
    all_pois = list(poi_cursor)

    # Filter POIs strictly by location fields using is_city_match
    filtered_pois = []
    if destination:
        for doc in all_pois:
            if is_city_match(doc, destination):
                filtered_pois.append(doc)

        # Supplement with curated destination landmarks if database POIs are fewer than 5
        dest_key = destination.strip().lower() if destination else ""
        city_fallbacks = []
        for key, fb_items in DESTINATION_FALLBACK_POIS.items():
            if key in dest_key or dest_key in key:
                city_fallbacks.extend(fb_items)

        if city_fallbacks:
            existing_ids = {p.get("id") or str(p.get("_id")) for p in filtered_pois}
            for fb_item in city_fallbacks:
                if fb_item["id"] not in existing_ids:
                    filtered_pois.append(fb_item)
    else:
        filtered_pois = all_pois

    # Score POIs using vector similarity + selected ID boost
    scored_pois = []
    for doc in filtered_pois:
        sim = compute_cosine_similarity(query_vec, doc.get("embedding"))
        source_id = doc.get("source_id", "")
        doc_id = str(doc.get("_id", ""))

        # Boost selected place IDs (checking both source_id and MongoDB _id string)
        boost = 1.0 if (source_id in selected_ids_set or doc_id in selected_ids_set) else 0.0
        total_score = sim + boost

        scored_pois.append((
            total_score,
            sim,
            {
                "id": doc_id,
                "source_id": source_id,
                "name": doc.get("name"),
                "city": doc.get("city"),
                "address": doc.get("address"),
                "rating": doc.get("rating"),
                "review_count": doc.get("review_count"),
                "popularity_index": doc.get("popularity_index"),
                "categories": doc.get("categories", []),
                "airport_distance_km": doc.get("airport_distance_km"),
                "airport_travel_time_min": doc.get("airport_travel_time_min"),
                "description": doc.get("description"),
                "images": doc.get("images", []),
                "similarity_score": round(sim, 4)
            }
        ))

    # Sort POIs by total score descending
    scored_pois.sort(key=lambda x: x[0], reverse=True)
    top_pois = [item[2] for item in scored_pois[:min(5, limit)]]

    mongo.close()

    result_payload = {
        "destination": destination,
        "budget_tier": budget_tier,
        "vibe_query": vibe_query,
        "total_hotels_matched": len(top_hotels),
        "total_poi_matched": len(top_pois),
        "hotels": top_hotels,
        "poi": top_pois
    }

    return json.dumps(result_payload, indent=2, default=str)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Test search_travel_database tool")
    parser.add_argument("--destination", type=str, default="Colombo", help="Target city/destination")
    parser.add_argument("--budget", type=str, default="Standard", help="Price tier (Budget, Standard, Luxury)")
    parser.add_argument("--vibe", type=str, default="luxury ocean view spa hotel near temple", help="Vibe/preference text query")
    args = parser.parse_args()

    results_json = search_travel_database(
        destination=args.destination,
        budget_tier=args.budget,
        vibe_query=args.vibe
    )
    print(results_json)
