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
    "nuwara eliya": ["nuwara eliya", "nanu oya", "pundaluoya", "hatton"],
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
            "images": ["/images/kandy.png"],
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
            "images": ["/images/kandy.png"],
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
            "images": ["/images/yala.png"],
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
            "images": ["/images/yala.png"],
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
            "images": ["/images/galle.png"],
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
            "images": ["/images/sigiriya.png"],
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
            "images": ["/images/dambulla.png"],
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
            "images": ["/images/nine_arch.png"],
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
            "images": ["/images/tea.png"],
            "ticket_price_usd": 5.0
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
    if budget_tier:
        tier_lower = budget_tier.strip().lower()
        if tier_lower == "budget":
            hotel_query["$or"] = [
                {"price_tier": {"$regex": "^Budget$", "$options": "i"}},
                {"avg_nightly": {"$lt": 40.0}}
            ]
        elif tier_lower == "standard":
            hotel_query["$or"] = [
                {"price_tier": {"$regex": "^Standard$", "$options": "i"}},
                {"avg_nightly": {"$gte": 40.0, "$lte": 120.0}}
            ]
        elif tier_lower == "luxury":
            hotel_query["$or"] = [
                {"price_tier": {"$regex": "^Luxury$", "$options": "i"}},
                {"avg_nightly": {"$gt": 120.0}}
            ]
        else:
            hotel_query["price_tier"] = {"$regex": f"^{re.escape(budget_tier)}$", "$options": "i"}

    hotels_cursor = mongo.db["hotels"].find(hotel_query)
    all_hotels = list(hotels_cursor)

    # Filter by destination strictly checking location fields using is_city_match
    filtered_hotels = []
    if destination:
        for doc in all_hotels:
            if is_city_match(doc, destination):
                filtered_hotels.append(doc)
                
        if len(filtered_hotels) < 3:
            logger.info(f"Strict destination match returned {len(filtered_hotels)} hotels; searching broader destination pool.")
            broader_cursor = mongo.db["hotels"].find(base_filter)
            existing_ids = {str(h.get("_id")) for h in filtered_hotels}
            for doc in broader_cursor:
                if str(doc.get("_id")) not in existing_ids:
                    if is_city_match(doc, destination):
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

    # Sort hotels by total score descending
    scored_hotels.sort(key=lambda x: x[0], reverse=True)
    top_hotels = [item[2] for item in scored_hotels[:min(3, limit)]]

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
