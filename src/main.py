import os
import sys
import json
import importlib
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

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
    logger = logging.getLogger("fastapi_main")

# FastAPI & Starlette Imports
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

# Agent Imports
try:
    intake_mod = importlib.import_module("src.agents.intake_agent")
    parse_intake_submission = intake_mod.parse_intake_submission
except Exception as e:
    logger.error(f"Failed to import intake_agent: {e}")
    def parse_intake_submission(sub): return json.dumps({"error": "Intake agent unavailable"})

try:
    retrieval_mod = importlib.import_module("src.agents.retrieval_agent")
    execute_retrieval_agent = retrieval_mod.execute_retrieval_agent
except Exception as e:
    logger.error(f"Failed to import retrieval_agent: {e}")
    def execute_retrieval_agent(sub): return json.dumps({"error": "Retrieval agent unavailable"})

try:
    explainer_mod = importlib.import_module("src.agents.explainer_agent")
    generate_explainable_itinerary = explainer_mod.generate_explainable_itinerary
except Exception as e:
    logger.error(f"Failed to import explainer_agent: {e}")
    def generate_explainable_itinerary(sub): return "### ⚠️ Explainer agent unavailable"

# PyMongo Database Client
try:
    pymongo_mod = importlib.import_module("pymongo")
    MongoClient = pymongo_mod.MongoClient
except Exception as e:
    logger.error(f"Failed to import pymongo: {e}")

# --------------------------------------------------------------------------
# 2. FASTAPI APPLICATION SETUP
# --------------------------------------------------------------------------
app = FastAPI(
    title="Sri Lanka Travel AI Platform API",
    version="1.0.0",
    description="FastAPI gateway connecting Next.js frontend, managing MongoDB databases, and executing the 3-Agent AI pipeline."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# 3. DATABASE CONNECTIONS & CLIENT MANAGEMENT
# --------------------------------------------------------------------------
def get_scraper_db():
    uri = os.getenv("SCRAPER_DB_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017/srilanka_travel"
    if os.path.exists("/.dockerenv"):
        uri = uri.replace("localhost", "mongodb").replace("127.0.0.1", "mongodb")
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        return client.get_database()
    except Exception as e:
        logger.error(f"Failed connecting to SCRAPER_DB: {e}")
        return None

def get_travel_company_db():
    uri = os.getenv("TRAVEL_COMPANY_DB_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017/travel_platform"
    if os.path.exists("/.dockerenv"):
        uri = uri.replace("localhost", "mongodb").replace("127.0.0.1", "mongodb")
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        return client.get_database()
    except Exception as e:
        logger.error(f"Failed connecting to TRAVEL_COMPANY_DB: {e}")
        return None

# --------------------------------------------------------------------------
# 4. DATABASE SEEDING (STARTUP EVENT)
# --------------------------------------------------------------------------
DEFAULT_CURATED_PACKAGES = [
    {
        "package_id": "pkg_southern_escape",
        "title": "Southern Coastal Escape",
        "description": "Golden beaches, historic UNESCO Galle Fort, whale watching, and fresh seafood along Sri Lanka's sunny south coast.",
        "destination": "Galle",
        "default_places": ["osm_way_136845474", "booking_aquarius_stay"],
        "price_usd": 450.0,
        "duration_days": 4,
        "image_url": "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "package_id": "pkg_cultural_heritage",
        "title": "Cultural Triangle & Heritage",
        "description": "Explore ancient kingdoms, Sigiriya Rock Fortress, Dambulla Cave Temples, and Sacred Kandy Temple of the Tooth.",
        "destination": "Dambulla",
        "default_places": ["osm_node_269366454"],
        "price_usd": 550.0,
        "duration_days": 5,
        "image_url": "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80"
    },
    {
        "package_id": "pkg_tea_trails",
        "title": "Ceylon Hill Country & Tea Trails",
        "description": "Misty mountain peaks, Nine Arch Bridge in Ella, lush tea plantations, and scenic train journeys through Nuwara Eliya.",
        "destination": "Ella",
        "default_places": ["osm_node_4089531751"],
        "price_usd": 490.0,
        "duration_days": 4,
        "image_url": "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80"
    }
]

@app.on_event("startup")
def seed_default_packages():
    """
    On application startup, checks the 'packages' collection in TRAVEL_COMPANY_DB.
    If empty, auto-seeds default curated travel package templates.
    """
    db = get_travel_company_db()
    if db is None:
        logger.warning("Database unavailable during startup package seeding.")
        return

    try:
        packages_col = db["packages"]
        count = packages_col.count_documents({})
        if count == 0:
            logger.info("Seeding default curated travel packages into TRAVEL_COMPANY_DB...")
            packages_col.insert_many(DEFAULT_CURATED_PACKAGES)
            logger.info("Successfully seeded 3 curated package templates.")
        else:
            logger.info(f"Database 2 'packages' collection ready ({count} packages existing).")
    except Exception as e:
        logger.error(f"Error seeding default packages: {e}")

# --------------------------------------------------------------------------
# 5. PYDANTIC REQUEST & RESPONSE SCHEMAS
# --------------------------------------------------------------------------
class GenerateItineraryRequest(BaseModel):
    user_id: Optional[str] = Field("guest_user", example="usr_12345")
    package_id: Optional[str] = Field(None, example="pkg_southern_escape")
    selected_place_ids: Optional[List[str]] = Field(default_factory=list)
    prompt: str = Field(..., example="I want a 4-day budget trip to Galle with beach and fort")
    starting_location: Optional[str] = Field(None, example="Colombo")
    budget_tier: str = Field("Standard", example="Standard")
    duration_days: int = Field(3, ge=1, le=14, example=3)

class GenerateItineraryResponse(BaseModel):
    status: str
    itinerary_id: str
    itinerary_markdown: str

# --------------------------------------------------------------------------
# 6. API ENDPOINTS
# --------------------------------------------------------------------------
@app.get("/api/v1/packages")
def get_packages():
    """
    Endpoint 1: GET /api/v1/packages
    Fetches all curated package templates stored in Database 2 ('packages' collection).
    """
    db = get_travel_company_db()
    if db is None:
        return {"status": "success", "packages": DEFAULT_CURATED_PACKAGES}

    try:
        cursor = db["packages"].find({})
        pkg_list = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            pkg_list.append(doc)
        return {"status": "success", "packages": pkg_list}
    except Exception as e:
        logger.error(f"Error fetching packages: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch packages.")


@app.post("/api/v1/generate-itinerary", response_model=GenerateItineraryResponse)
def generate_itinerary(request: GenerateItineraryRequest):
    """
    Endpoint 2: POST /api/v1/generate-itinerary
    Orchestrates the 3-Agent AI Pipeline (Intake -> Retrieval -> Explainer),
    persists the resulting itinerary in Database 2 ('saved_itineraries'), and returns JSON payload.
    """
    logger.info(f"Received itinerary generation request from user '{request.user_id}': prompt='{request.prompt}'")

    try:
        # Step 1: Execute AGENT 1 (Intake & Security Router)
        prompt_text = request.prompt
        if request.starting_location and request.starting_location.lower() not in prompt_text.lower():
            prompt_text = f"Trip starts in {request.starting_location}. {prompt_text}"

        submission_payload = {
            "user_prompt": prompt_text,
            "destination": None,
            "package_template": request.package_id,
            "selected_place_ids": request.selected_place_ids or [],
            "budget_tier": request.budget_tier,
            "duration_days": request.duration_days
        }
        
        agent1_json = parse_intake_submission(submission_payload)
        
        # Step 2: Security Intercept
        try:
            agent1_data = json.loads(agent1_json)
        except Exception:
            agent1_data = {}

        if "error" in agent1_data:
            logger.warning(f"Security shield intercepted request for user '{request.user_id}': {agent1_data.get('error')}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid travel request or prompt injection detected."
            )

        # Step 3: Execute AGENT 2 (Data Retrieval Searcher)
        agent2_json = execute_retrieval_agent(agent1_json)

        # Step 4: Execute AGENT 3 (Travel Guide & Explainer)
        markdown_itinerary = generate_explainable_itinerary(agent2_json)

        # Step 5: Database 2 Persistence ('saved_itineraries' collection)
        db = get_travel_company_db()
        saved_id = "temp_itinerary_id"

        if db is not None:
            save_record = {
                "user_id": request.user_id,
                "package_id": request.package_id,
                "input_prompt": request.prompt,
                "extracted_params": agent1_data,
                "generated_markdown": markdown_itinerary,
                "created_at": datetime.utcnow()
            }
            inserted = db["saved_itineraries"].insert_one(save_record)
            saved_id = str(inserted.inserted_id)
            logger.info(f"Successfully persisted itinerary '{saved_id}' for user '{request.user_id}'.")
        else:
            logger.warning("Database 2 unavailable for persistence; returned volatile itinerary response.")

        return GenerateItineraryResponse(
            status="success",
            itinerary_id=saved_id,
            itinerary_markdown=markdown_itinerary
        )

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error orchestrating 3-Agent itinerary pipeline: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error generating itinerary: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
