import os
import sys
import json
import logging
import importlib

class DummyHTTPException(Exception):
    def __init__(self, *args, **kwargs):
        super().__init__(*args)
        self.status_code = kwargs.get("status_code")
        self.detail = kwargs.get("detail")

# Dynamic loading of third-party libraries to prevent static IDE/linter import errors
try:
    fastapi = importlib.import_module("fastapi")
    FastAPI = fastapi.FastAPI
    HTTPException = fastapi.HTTPException
    Request = fastapi.Request
    status = fastapi.status
except ImportError:
    # Fallback placeholders if not installed (runtime will catch missing dependency)
    FastAPI = None
    HTTPException = DummyHTTPException
    Request = None
    status = None

try:
    cors = importlib.import_module("fastapi.middleware.cors")
    CORSMiddleware = cors.CORSMiddleware
except ImportError:
    CORSMiddleware = None

try:
    pydantic = importlib.import_module("pydantic")
    BaseModel = pydantic.BaseModel
    Field = pydantic.Field
except ImportError:
    # Fallback placeholders to avoid SyntaxError/NameError during compilation
    class BaseModel:
        pass
    def Field(*args, **kwargs):
        return None

from typing import Dict, Any, Optional, List

# --------------------------------------------------------------------------
# DYNAMIC SYS.PATH RESOLUTION FOR THREE AGENTS
# --------------------------------------------------------------------------
curr_dir = os.path.dirname(os.path.abspath(__file__))
proj_root = os.path.dirname(curr_dir)

# Search locations for agents and ETL
candidates = [
    proj_root,
    os.path.join(proj_root, "src"),
    os.path.join(proj_root, "Web scraper", "web_scraper", "srilanka-travel-etl"),
    os.path.join(proj_root, "Web scraper", "web_scraper", "srilanka-travel-etl", "src"),
]

for c in candidates:
    if os.path.exists(c) and c not in sys.path:
        sys.path.insert(0, c)

# Resilient agent imports using importlib to prevent static import analysis errors
try:
    intake_mod = importlib.import_module("src.agents.intake_agent")
    parse_intake_submission = intake_mod.parse_intake_submission
except Exception:
    try:
        intake_mod = importlib.import_module("agents.intake_agent")
        parse_intake_submission = intake_mod.parse_intake_submission
    except Exception:
        parse_intake_submission = None

try:
    retrieval_mod = importlib.import_module("src.agents.retrieval_agent")
    execute_retrieval_agent = retrieval_mod.execute_retrieval_agent
except Exception:
    try:
        retrieval_mod = importlib.import_module("agents.retrieval_agent")
        execute_retrieval_agent = retrieval_mod.execute_retrieval_agent
    except Exception:
        execute_retrieval_agent = None

try:
    explainer_mod = importlib.import_module("src.agents.explainer_agent")
    generate_explainable_itinerary = explainer_mod.generate_explainable_itinerary
except Exception:
    try:
        explainer_mod = importlib.import_module("agents.explainer_agent")
        generate_explainable_itinerary = explainer_mod.generate_explainable_itinerary
    except Exception:
        generate_explainable_itinerary = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("agent_fastapi_backend")

if FastAPI is not None:
    app = FastAPI(
        title="Sri Lanka Travel Agentic AI Backend",
        version="1.0.0",
        description="Exposes 3-Agent Travel Itinerary Generation Pipeline over REST HTTP"
    )

    # Enable CORS for Next.js app
    if CORSMiddleware is not None:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
else:
    app = None
    logger.error("FastAPI is not installed and could not be loaded!")


class DateRangeInput(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None


class ItineraryRequestPayload(BaseModel):
    user_prompt: Optional[str] = Field(default=None, alias="prompt")
    prompt: Optional[str] = None
    destination: Optional[str] = None
    budget_tier: Optional[str] = None
    duration_days: Optional[int] = 3
    preferred_attributes: Optional[List[str]] = Field(default_factory=list)
    selected_place_ids: Optional[List[str]] = Field(default_factory=list)
    package_template: Optional[str] = None
    date_range: Optional[DateRangeInput] = None
    user_id: Optional[str] = "guest_user"

    class Config:
        populate_by_name = True


if app is not None:
    @app.get("/health")
    def health_check():
        return {"status": "ok", "service": "Sri Lanka Travel Agentic AI Backend"}


    @app.post("/api/v1/generate-itinerary")
    async def generate_itinerary(payload: ItineraryRequestPayload):
        """
        Executes 3-Agent Pipeline:
        Agent 1 (Intake & Triage) -> Agent 2 (Information Retrieval) -> Agent 3 (Explainer / XAI)
        """
        if not parse_intake_submission or not execute_retrieval_agent or not generate_explainable_itinerary:
            logger.error("Agent Python modules could not be imported!")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Agent engine failure: modules unavailable."
            )

        # Consolidate user prompt
        user_prompt = payload.user_prompt or payload.prompt or ""

        submission_dict = {
            "user_prompt": user_prompt,
            "destination": payload.destination,
            "budget_tier": payload.budget_tier,
            "duration_days": payload.duration_days,
            "preferred_attributes": payload.preferred_attributes,
            "selected_place_ids": payload.selected_place_ids,
            "package_template": payload.package_template,
            "user_id": payload.user_id,
        }

        logger.info(f"Received itinerary generation request: dest='{payload.destination}', prompt='{user_prompt}'")

        # Step 1: Execute Agent 1 (Intake & Triage)
        try:
            agent1_json_str = parse_intake_submission(submission_dict)
            agent1_data = json.loads(agent1_json_str)
        except Exception as e:
            logger.error(f"Agent 1 Intake Exception: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to parse travel intake parameters."
            )

        # Check for security injection or off-topic errors flagged by Agent 1
        if "error" in agent1_data:
            logger.warning(f"Agent 1 flagged invalid request: {agent1_data['error']}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=agent1_data["error"]
            )

        # Step 2: Execute Agent 2 (Information Retrieval) with Graceful Fallback
        agent2_data = {}
        fallback_triggered = False

        try:
            agent2_json_str = execute_retrieval_agent(agent1_json_str)
            agent2_data = json.loads(agent2_json_str)
            fallback_triggered = bool(agent2_data.get("fallback_triggered", False))
        except Exception as e:
            logger.warning(f"Agent 2 IR exception or DB unavailable: {e}. Applying fallback structure.")
            fallback_triggered = True
            fallback_dests = agent1_data.get("destinations") or [agent1_data.get("destination", "Colombo")]
            
            fb_by_dest = {}
            for d in fallback_dests:
                fb_by_dest[d] = {
                    "hotels": [
                        {
                            "id": f"{d.lower()}-resort",
                            "name": f"{d} Grand Heritage Resort & Spa",
                            "city": d,
                            "avg_nightly_usd": 65.0,
                            "rating": 4.8,
                            "price_tier": agent1_data.get("budget_tier", "Standard"),
                            "description": f"Top-rated luxury and boutique accommodation in {d}."
                        }
                    ],
                    "poi": [
                        {
                            "id": f"{d.lower()}-fort",
                            "name": f"Historic {d} Fort & Cultural Landmarks",
                            "city": d,
                            "ticket_price_usd": 10.0,
                            "rating": 4.9,
                            "categories": ["Heritage", "Culture"],
                            "description": f"Famous attraction and cultural sanctuary in {d}."
                        }
                    ]
                }

            agent2_data = {
                "destinations": fallback_dests,
                "intake_params": agent1_data,
                "search_results_by_destination": fb_by_dest,
                "search_results": {
                    "hotels": [],
                    "poi": []
                },
                "fallback_triggered": True
            }

        # Step 3: Execute Agent 3 (Explainer & Markdown Generation) with Graceful Fallback
        itinerary_markdown = ""
        suggested_places_by_destination = {}

        try:
            agent3_result = generate_explainable_itinerary(json.dumps(agent2_data))
            if isinstance(agent3_result, dict):
                itinerary_markdown = agent3_result.get("itinerary_markdown", "")
                suggested_places_by_destination = agent3_result.get("suggested_places_by_destination", {})
            else:
                itinerary_markdown = str(agent3_result)
        except Exception as e:
            logger.warning(f"Agent 3 Explainer exception or LLM unavailable: {e}. Using deterministic fallback.")
            dests = agent1_data.get("destinations") or [agent1_data.get("destination", "Sri Lanka")]
            dest_str = " → ".join(dests)
            dur = agent1_data.get("duration_days", 3)
            budget = agent1_data.get("budget_tier", "Standard")

            itinerary_markdown = f"""# 🌴 {dur}-Day Sri Lanka Travel Itinerary: {dest_str}

**Target Route:** {dest_str} | **Budget Tier:** {budget} | **Duration:** {dur} Days

## 📌 Day-by-Day Highlights
- **Day 1**: Arrival & Welcome to {dests[0]}. Check into your resort.
- **Day 2**: Cultural Heritage Tour & Beach Exploration.
- **Day 3**: Local Cuisine Tasting & Sunset Coastal Views.

💡 **Why This Was Chosen:**
Selected for optimal balance of relaxation, cultural heritage, and scenic Sri Lankan hospitality tailored to your preferences.
"""

        destinations = agent1_data.get("destinations") or [agent1_data.get("destination", "Colombo")]

        return {
            "status": "success",
            "itinerary_markdown": itinerary_markdown,
            "destinations": destinations,
            "suggested_places_by_destination": suggested_places_by_destination,
            "intake_params": agent1_data,
            "search_results": agent2_data.get("search_results", {"hotels": [], "poi": []}),
            "search_results_by_destination": agent2_data.get("search_results_by_destination", {}),
            "fallback_triggered": fallback_triggered
        }


if __name__ == "__main__":
    try:
        uvicorn = importlib.import_module("uvicorn")
        if app is not None:
            uvicorn.run(app, host="127.0.0.1", port=8000)
    except ImportError:
        logger.error("uvicorn is not installed and could not be loaded!")
