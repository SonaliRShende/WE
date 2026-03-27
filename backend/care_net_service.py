import os
import re
import logging
from datetime import datetime

try:
    from care_net import CARENetRanker
except ImportError:  # pragma: no cover - package import fallback
    from backend.care_net import CARENetRanker

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional during bootstrap
    def load_dotenv(*args, **kwargs):
        return False

load_dotenv()

logger = logging.getLogger("backend.care_net_service")

mongo_client = None
db = None
js_embeddings_collection = None
jp_embeddings_collection = None
job_scores_collection = None

ranker = None


REMOTE_LOCATION_HINTS = ("remote", "work from home", "wfh", "home based", "anywhere")
STRICT_LOCALITY_HINTS = (
    "outside",
    "out of",
    "only in",
    "same city",
    "within city",
    "not outside",
    "dont want outside",
    "do not want outside",
)


def _is_demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "0").strip().lower() in {"1", "true", "yes", "on"}


def get_db():
    """Lazy load MongoDB connection only when needed."""
    global mongo_client, db, js_embeddings_collection, jp_embeddings_collection, job_scores_collection

    if mongo_client is None:
        try:
            from pymongo.mongo_client import MongoClient
            from pymongo.server_api import ServerApi
        except ImportError as exc:
            raise RuntimeError("pymongo is required to access MongoDB. Install backend requirements first.") from exc

        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            raise Exception("ERROR: MONGO_URI not found in .env file.")

        try:
            mongo_client = MongoClient(mongo_uri, server_api=ServerApi("1"))
            mongo_client.admin.command("ping")
            logger.info("Connected to MongoDB Atlas")
        except Exception as exc:
            raise Exception(f"MongoDB connection failed: {exc}")

        db = mongo_client["skill_constraint_db"]
        js_embeddings_collection = db["JS_embeddings"]
        jp_embeddings_collection = db["JP_embeddings"]
        job_scores_collection = db["job_scores"]

    return {
        "db": db,
        "js_embeddings": js_embeddings_collection,
        "jp_embeddings": jp_embeddings_collection,
        "job_scores": job_scores_collection,
    }


def get_ranker():
    global ranker

    if ranker is None:
        weight_predictor = None
        graph_signal_provider = None
        demo_mode = _is_demo_mode()
        model_dir = os.getenv("CARE_NET_MODEL_DIR", os.path.join(os.path.dirname(__file__), "models"))
        dynamic_model_path = os.path.join(model_dir, "dynamic_weight_model.pt")
        graph_model_path = os.path.join(model_dir, "graph_signal_model.pt")
        minimum_graph_accuracy = float(os.getenv("CARE_NET_MIN_GRAPH_ACCURACY", "0.50"))

        if demo_mode:
            logger.info("DEMO_MODE enabled: skipping dynamic and graph model loading for low-memory runtime")
        elif os.path.exists(dynamic_model_path):
            try:
                try:
                    from dynamic_weight_learning import DynamicWeightPredictor
                except ImportError:  # pragma: no cover - package import fallback
                    from backend.dynamic_weight_learning import DynamicWeightPredictor

                weight_predictor = DynamicWeightPredictor.load(dynamic_model_path)
                logger.info("Loaded dynamic weight model from %s", dynamic_model_path)
            except Exception as exc:
                logger.warning("Dynamic weight model unavailable, falling back to rule-based weights: %s", exc)

        if (not demo_mode) and os.path.exists(graph_model_path):
            try:
                try:
                    from graph_learning import GraphSignalProvider
                except ImportError:  # pragma: no cover - package import fallback
                    from backend.graph_learning import GraphSignalProvider
                import torch

                graph_artifact = torch.load(graph_model_path, map_location="cpu")
                graph_accuracy = float(graph_artifact.get("training_accuracy", 0.0))
                if graph_accuracy >= minimum_graph_accuracy:
                    graph_signal_provider = GraphSignalProvider.load(graph_model_path)
                    logger.info(
                        f"Loaded graph signal model from {graph_model_path} "
                        f"(training_accuracy={graph_accuracy:.4f})"
                    )
                else:
                    logger.warning(
                        f"Skipping graph signal model from {graph_model_path} because "
                        f"training_accuracy={graph_accuracy:.4f} is below {minimum_graph_accuracy:.2f}"
                    )
            except Exception as exc:
                logger.warning("Graph signal model unavailable, falling back to zero graph signal: %s", exc)

        ranker = CARENetRanker(
            weight_predictor=weight_predictor,
            graph_signal_provider=graph_signal_provider,
        )

    return ranker


def _get_user_constraints_blob(user_doc):
    constraints = user_doc.get("constraints_embeddings", [])
    text_parts = [str(item.get("constraint_text", "")) for item in constraints if isinstance(item, dict)]
    return " ".join(text_parts).lower().strip()


def _get_user_city(user_doc):
    location = user_doc.get("location_embedding")
    if isinstance(location, dict):
        city = str(location.get("location", "")).strip().lower()
        return city
    return ""


def _is_remote_friendly_job(job_doc):
    location_text = str(job_doc.get("jobLocation_text", "")).lower()
    job_type_text = str(job_doc.get("jobType_text", "")).lower()
    combined = f"{location_text} {job_type_text}"
    return any(keyword in combined for keyword in REMOTE_LOCATION_HINTS)


def _should_enforce_city_filter(user_doc):
    constraints_blob = _get_user_constraints_blob(user_doc)
    return any(keyword in constraints_blob for keyword in STRICT_LOCALITY_HINTS)


def _extract_keyword_terms(user_doc):
    terms = []

    for item in user_doc.get("skills_embeddings", []):
        if not isinstance(item, dict):
            continue
        raw = str(item.get("skill_name", "")).strip().lower()
        if not raw:
            continue
        for token in re.split(r"[^a-z0-9+#]+", raw):
            token = token.strip()
            if len(token) >= 3:
                terms.append(token)

    deduped = []
    seen = set()
    for token in terms:
        if token not in seen:
            seen.add(token)
            deduped.append(token)
        if len(deduped) >= 8:
            break
    return deduped


def _prefilter_jobs_for_user(jp_collection, user_doc):
    base_projection = {
        "posting_id": 1,
        "user_id": 1,
        "jobTitle": 1,
        "company": 1,
        "companyName": 1,
        "jobLocation_text": 1,
        "jobType_text": 1,
        "jobTitle_embedding": 1,
        "jobCategory_embedding": 1,
        "experienceRequired_embedding": 1,
        "jobLocation_embedding": 1,
        "jobType_embedding": 1,
        "qualifications_embeddings": 1,
        "job_requirements_embeddings": 1,
        "benefits_embeddings": 1,
        "requiredQualifications_text": 1,
        "benefits_text": 1,
        "experienceRequired_text": 1,
        "graph_signal": 1,
    }

    user_city = _get_user_city(user_doc)
    enforce_city_filter = bool(user_city) and _should_enforce_city_filter(user_doc)
    demo_mode = _is_demo_mode()
    candidate_limit = int(os.getenv("RECOMMENDATION_CANDIDATE_LIMIT", "12" if demo_mode else "50"))
    if demo_mode:
        candidate_limit = max(1, min(candidate_limit, 15))
    prefetch_multiplier = 1 if demo_mode else int(os.getenv("RECOMMENDATION_PREFETCH_MULTIPLIER", "4"))
    fetch_cap = max(candidate_limit, candidate_limit * max(prefetch_multiplier, 1))

    query = {}
    and_conditions = []

    if enforce_city_filter:
        and_conditions.append(
            {
                "$or": [
                    {"jobLocation_text": {"$regex": re.escape(user_city), "$options": "i"}},
                    {"jobType_text": {"$regex": "remote|work from home|wfh|home based|anywhere", "$options": "i"}},
                ]
            }
        )

    keyword_terms = _extract_keyword_terms(user_doc)
    if keyword_terms:
        keyword_regex = "|".join(re.escape(term) for term in keyword_terms)
        and_conditions.append(
            {
                "$or": [
                    {"jobTitle": {"$regex": keyword_regex, "$options": "i"}},
                    {"jobDescription_text": {"$regex": keyword_regex, "$options": "i"}},
                    {"requiredQualifications_text": {"$regex": keyword_regex, "$options": "i"}},
                ]
            }
        )

    if and_conditions:
        query["$and"] = and_conditions

    jobs = list(
        jp_collection.find(query, projection=base_projection)
        .sort("updated_at", -1)
        .limit(fetch_cap)
    )

    if not jobs and query:
        jobs = list(
            jp_collection.find({}, projection=base_projection)
            .sort("updated_at", -1)
            .limit(fetch_cap)
        )

    if not enforce_city_filter:
        return jobs[:candidate_limit], len(jobs)

    filtered_jobs = []
    for job_doc in jobs:
        job_location_text = str(job_doc.get("jobLocation_text", "")).lower()
        if user_city in job_location_text or _is_remote_friendly_job(job_doc):
            filtered_jobs.append(job_doc)
        if len(filtered_jobs) >= candidate_limit:
            break

    return filtered_jobs, len(jobs)


def generate_job_recommendations(user_id):
    """
    Generate ranked CARE-Net job recommendations for a specific user.
    """
    logger.info("Generating CARE-Net recommendations for user_id=%s", user_id)

    collections = get_db()
    js_collection = collections["js_embeddings"]
    jp_collection = collections["jp_embeddings"]
    job_scores = collections["job_scores"]

    try:
        from bson import ObjectId
        user_id_obj = ObjectId(user_id) if isinstance(user_id, str) else user_id
    except Exception as exc:
        logger.warning("Invalid user_id format: %s - %s", user_id, exc)
        return []

    cached = job_scores.find_one({"user_id": user_id_obj}, {"ranked_jobs": 1, "stale": 1})
    if cached and not bool(cached.get("stale", False)):
        ranked_jobs = cached.get("ranked_jobs", [])
        if isinstance(ranked_jobs, list):
            logger.info("Returning cached recommendations for user_id=%s count=%s", user_id, len(ranked_jobs))
            return ranked_jobs

    user_doc = js_collection.find_one({"user_id": user_id_obj})
    if not user_doc:
        logger.warning("User embeddings not found for user_id=%s", user_id)
        return []

    logger.info("User loaded user_id=%s name=%s", user_id, user_doc.get("name", "Unknown"))

    all_jobs, prefiltered_count = _prefilter_jobs_for_user(jp_collection, user_doc)
    logger.info("Jobs fetched for ranking user_id=%s count=%s prefiltered_count=%s", user_id, len(all_jobs), prefiltered_count)

    ranker_instance = get_ranker()
    logger.info("Ranking started user_id=%s", user_id)
    ranked_jobs, diagnostics = ranker_instance.rank_jobs(user_doc, all_jobs)
    logger.info("Ranking completed user_id=%s ranked=%s", user_id, len(ranked_jobs))

    write_result = job_scores.update_one(
        {"user_id": user_id_obj},
        {
            "$set": {
                "user_id": user_id_obj,
                "ranked_jobs": ranked_jobs,
                "generated_at": datetime.now(),
                "total_jobs_evaluated": len(all_jobs),
                "prefiltered_jobs": prefiltered_count,
                "recommended_jobs": len(ranked_jobs),
                "rejected_by_skill_gate": diagnostics["rejected_by_skill_gate"],
                "low_skill_confidence": diagnostics.get("low_skill_confidence", 0),
                "algorithm": "CARE-Net",
                "stale": False,
            }
        },
        upsert=True,
    )

    logger.info(
        "Results stored user_id=%s matched=%s modified=%s upserted=%s",
        user_id,
        write_result.matched_count,
        write_result.modified_count,
        write_result.upserted_id,
    )

    return ranked_jobs


def main():
    print("\n" + "=" * 60)
    print("CARE-NET RECOMMENDATION SERVICE")
    print("=" * 60)

    try:
        collections = get_db()
        js_collection = collections["js_embeddings"]

        for user_embedding_doc in js_collection.find():
            user_id = user_embedding_doc.get("user_id")
            if user_id:
                generate_job_recommendations(str(user_id))
            else:
                print(f"Skipping document with no user_id: {user_embedding_doc.get('_id')}")
    except Exception as exc:
        print(f"ERROR in main: {exc}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
