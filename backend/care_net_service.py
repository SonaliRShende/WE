import os
import re
import logging
from datetime import datetime
import numpy as np

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

CITY_ALIAS_MAP = {
    "मुंबई": {"mumbai", "bombay"},
    "mumbai": {"मुंबई", "bombay"},
    "पुणे": {"pune"},
    "pune": {"पुणे"},
    "दिल्ली": {"delhi", "new delhi"},
    "delhi": {"दिल्ली", "new delhi"},
    "new delhi": {"delhi", "दिल्ली"},
    "नाशिक": {"nashik"},
    "nashik": {"नाशिक"},
    "नागपूर": {"nagpur"},
    "nagpur": {"नागपूर"},
}


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


def _expand_city_aliases(city_text):
    normalized = str(city_text or "").strip().lower()
    if not normalized:
        return []

    aliases = {normalized}
    aliases.update(CITY_ALIAS_MAP.get(normalized, set()))
    # Keep deterministic order for predictable filtering
    return [alias for alias in sorted(aliases) if alias]


def _location_semantic_match(user_doc, job_doc, threshold=0.45):
    user_location = user_doc.get("location_embedding")
    job_location = job_doc.get("jobLocation_embedding")

    if not isinstance(user_location, dict) or not isinstance(job_location, dict):
        return False

    user_vec = user_location.get("embedding")
    job_vec = job_location.get("embedding")
    try:
        user_arr = np.asarray(user_vec, dtype=float).reshape(-1)
        job_arr = np.asarray(job_vec, dtype=float).reshape(-1)
    except Exception:
        return False

    if user_arr.size == 0 or job_arr.size == 0:
        return False

    user_norm = float(np.linalg.norm(user_arr))
    job_norm = float(np.linalg.norm(job_arr))
    if user_norm == 0.0 or job_norm == 0.0:
        return False

    similarity = float(np.dot(user_arr, job_arr) / (user_norm * job_norm))
    return similarity >= threshold


def _quick_skill_relevance(user_doc, job_doc):
    user_vectors = []
    for item in user_doc.get("skills_embeddings", []):
        if isinstance(item, dict):
            vec = item.get("embedding")
            if isinstance(vec, list) and vec:
                user_vectors.append(vec)

    qualification = user_doc.get("qualification_embedding")
    if isinstance(qualification, dict):
        qvec = qualification.get("embedding")
        if isinstance(qvec, list) and qvec:
            user_vectors.append(qvec)

    if not user_vectors:
        return 0.0

    job_vectors = []
    for field in ("jobTitle_embedding", "jobCategory_embedding"):
        value = job_doc.get(field)
        if isinstance(value, dict):
            vec = value.get("embedding")
            if isinstance(vec, list) and vec:
                job_vectors.append(vec)

    for item in (job_doc.get("job_requirements_embeddings") or [])[:3]:
        if isinstance(item, dict):
            vec = item.get("embedding")
            if isinstance(vec, list) and vec:
                job_vectors.append(vec)

    if not job_vectors:
        return 0.0

    try:
        user_matrix = np.asarray(user_vectors, dtype=float)
        job_matrix = np.asarray(job_vectors, dtype=float)
    except Exception:
        return 0.0

    user_norms = np.linalg.norm(user_matrix, axis=1, keepdims=True)
    job_norms = np.linalg.norm(job_matrix, axis=1, keepdims=True)
    if np.any(user_norms == 0.0) or np.any(job_norms == 0.0):
        return 0.0

    user_matrix = user_matrix / user_norms
    job_matrix = job_matrix / job_norms
    sim = np.matmul(user_matrix, job_matrix.T)
    return float(np.max(sim)) if sim.size else 0.0


def _should_enforce_city_filter(user_doc):
    constraints_blob = _get_user_constraints_blob(user_doc)
    return any(keyword in constraints_blob for keyword in STRICT_LOCALITY_HINTS)


def _extract_keyword_terms(user_doc):
    terms = []
    stopwords = {
        "and",
        "the",
        "for",
        "with",
        "from",
        "into",
        "your",
        "job",
        "work",
        "role",
    }

    for item in user_doc.get("skills_embeddings", []):
        if not isinstance(item, dict):
            continue
        raw = str(item.get("skill_name", "")).strip().lower()
        if not raw:
            continue
        for token in re.split(r"[^a-z0-9+#]+", raw):
            token = token.strip()
            if len(token) >= 3:
                if token in stopwords:
                    continue
                terms.append(token)
                if token.endswith("ing") and len(token) > 5:
                    terms.append(token[:-3])
                if token.endswith("ed") and len(token) > 4:
                    terms.append(token[:-2])
                if token.endswith("s") and len(token) > 4:
                    terms.append(token[:-1])

    deduped = []
    seen = set()
    for token in terms:
        if token not in seen:
            seen.add(token)
            deduped.append(token)
        if len(deduped) >= 48:
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
    user_city_aliases = _expand_city_aliases(user_city)
    enforce_city_filter = bool(user_city) and _should_enforce_city_filter(user_doc)
    demo_mode = _is_demo_mode()
    candidate_limit = int(os.getenv("RECOMMENDATION_CANDIDATE_LIMIT", "12" if demo_mode else "50"))
    if demo_mode:
        candidate_limit = max(1, min(candidate_limit, 15))
    prefetch_multiplier = 1 if demo_mode else int(os.getenv("RECOMMENDATION_PREFETCH_MULTIPLIER", "4"))
    fetch_cap = max(candidate_limit, candidate_limit * max(prefetch_multiplier, 1))

    query = {}
    and_conditions = []

    if enforce_city_filter and user_city_aliases:
        city_pattern = "|".join(re.escape(alias) for alias in user_city_aliases)
        and_conditions.append(
            {
                "$or": [
                    {"jobLocation_text": {"$regex": city_pattern, "$options": "i"}},
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

    # Blend with recent jobs so lexical keyword misses do not hide strong semantic matches.
    if len(jobs) < fetch_cap:
        recent_jobs = list(
            jp_collection.find({}, projection=base_projection)
            .sort("updated_at", -1)
            .limit(fetch_cap)
        )
        merged = []
        seen = set()
        for job_doc in jobs + recent_jobs:
            identity = str(job_doc.get("posting_id") or job_doc.get("_id"))
            if identity in seen:
                continue
            seen.add(identity)
            merged.append(job_doc)
            if len(merged) >= fetch_cap:
                break
        jobs = merged

    if not jobs and query:
        jobs = list(
            jp_collection.find({}, projection=base_projection)
            .sort("updated_at", -1)
            .limit(fetch_cap)
        )

    if not enforce_city_filter:
        ranked_jobs = sorted(jobs, key=lambda job_doc: _quick_skill_relevance(user_doc, job_doc), reverse=True)
        return ranked_jobs[:candidate_limit], len(jobs)

    filtered_jobs = []
    for job_doc in jobs:
        job_location_text = str(job_doc.get("jobLocation_text", "")).lower()
        city_text_match = any(alias in job_location_text for alias in user_city_aliases)
        if (
            city_text_match
            or _is_remote_friendly_job(job_doc)
            or _location_semantic_match(user_doc, job_doc)
        ):
            filtered_jobs.append(job_doc)

    ranked_filtered = sorted(filtered_jobs, key=lambda job_doc: _quick_skill_relevance(user_doc, job_doc), reverse=True)
    return ranked_filtered[:candidate_limit], len(jobs)


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
