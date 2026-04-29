import os
import hashlib
import traceback
import threading
import logging
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from datetime import datetime
import numpy as np

# Load environment variables
load_dotenv()

# Global variables for lazy loading
model = None
model_lock = threading.Lock()
mongo_client = None
db = None
applications_collection = None
job_postings_collection = None
js_embeddings_collection = None
jp_embeddings_collection = None

logger = logging.getLogger("backend.embedding_service")


def _is_demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "0").strip().lower() in {"1", "true", "yes", "on"}


class DeterministicEmbeddingModel:
    """Lightweight demo embedding backend with deterministic 384-d vectors."""

    def __init__(self, dimension: int = 384):
        self.dimension = int(dimension)

    def encode(self, text: str):
        text = str(text or "")
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        seed = int.from_bytes(digest[:8], byteorder="big", signed=False)
        rng = np.random.default_rng(seed)
        vector = rng.standard_normal(self.dimension)
        norm = float(np.linalg.norm(vector))
        if norm > 0.0:
            vector = vector / norm
        return vector


def get_model():
    """Lazy load the Sentence-BERT model only when needed"""
    global model
    if model is None:
        with model_lock:
            if model is None:
                if _is_demo_mode():
                    logger.info("DEMO_MODE is enabled. Using deterministic hash embeddings (384d).")
                    model = DeterministicEmbeddingModel(dimension=384)
                else:
                    from sentence_transformers import SentenceTransformer

                    logger.info("Loading Sentence-BERT model (all-MiniLM-L6-v2)")
                    model = SentenceTransformer('all-MiniLM-L6-v2')
                    logger.info("Sentence-BERT model loaded successfully")
    return model


def get_db():
    """Lazy load MongoDB connection only when needed"""
    global mongo_client, db, applications_collection, job_postings_collection, js_embeddings_collection, jp_embeddings_collection
    
    if mongo_client is None:
        MONGO_URI = os.getenv("MONGO_URI")
        if not MONGO_URI:
            raise Exception("❌ ERROR: MONGO_URI not found in .env file.")
        
        try:
            mongo_client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
            mongo_client.admin.command('ping')
            print("✅ Connected to MongoDB Atlas!")
        except Exception as e:
            raise Exception(f"❌ MongoDB Connection failed: {e}")
        
        db = mongo_client['skill_constraint_db']
        applications_collection = db['job_applications']
        job_postings_collection = db['job_postings']
        js_embeddings_collection = db['JS_embeddings']
        jp_embeddings_collection = db['JP_embeddings']
    
    return {
        'db': db,
        'applications': applications_collection,
        'postings': job_postings_collection,
        'js_embeddings': js_embeddings_collection,
        'jp_embeddings': jp_embeddings_collection
    }


def _normalized_text(value) -> str:
    return " ".join(str(value or "").split()).strip().lower()


def _embedding_list(value):
    if isinstance(value, list) and value:
        return value
    if hasattr(value, "tolist"):
        try:
            converted = value.tolist()
            if isinstance(converted, list) and converted:
                return converted
        except Exception:
            return None
    return None


def _build_existing_item_embedding_map(items, text_key):
    mapping = {}
    if not isinstance(items, list):
        return mapping
    for item in items:
        if not isinstance(item, dict):
            continue
        text_value = item.get(text_key, "")
        key = _normalized_text(text_value)
        embedding = _embedding_list(item.get("embedding"))
        if key and embedding:
            mapping[key] = embedding
    return mapping


def embed_specific_job_seeker(user_id):
    """
    Generate embeddings for a SPECIFIC job seeker only.
    Called when a single user updates their application.
    
    Args:
        user_id: ObjectId or string of the user
    """
    try:
        from bson import ObjectId
        
        print(f"[{datetime.now()}] embed_specific_job_seeker START - user_id: {user_id}")
        
        collections = get_db()
        applications_collection = collections['applications']
        js_embeddings_collection = collections['js_embeddings']
        model_instance = None

        def encode_text(text):
            nonlocal model_instance
            if model_instance is None:
                model_instance = get_model()
            return model_instance.encode(text).tolist()
        
        # Convert string to ObjectId if needed
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
            print(f"[{datetime.now()}] Converted user_id to ObjectId: {user_id}")
        
        # Fetch only this user's application
        app = applications_collection.find_one({"user_id": user_id})
        
        if not app:
            print(f"[{datetime.now()}] ⚠️  No application found for user_id: {user_id}")
            return False
        
        app_id = app['_id']
        print(f"[{datetime.now()}] [SELECTIVE] Embedding job seeker: {user_id}, app_id: {app_id}")
        existing_embedding_doc = js_embeddings_collection.find_one({"user_id": user_id}) or {}
        existing_skill_map = _build_existing_item_embedding_map(existing_embedding_doc.get("skills_embeddings", []), "skill_name")
        existing_constraint_map = _build_existing_item_embedding_map(existing_embedding_doc.get("constraints_embeddings", []), "constraint_text")
        
        embeddings_data = {
            "application_id": app_id,
            "user_id": user_id,
            "type": "job_seeker",
            "name": app.get('name', ''),
            "email": app.get('email', ''),
            "skills_text": app.get('skills', ''),
            "preferences_text": app.get('preferences', ''),
            "qualification_text": app.get('qualification', ''),
            "location_text": app.get('location', ''),
            "skills_embeddings": [],
            "constraints_embeddings": [],
            "qualification_embedding": [],
            "location_embedding": {},
            "updated_at": datetime.now()
        }
        
        # Process Skills
        if 'structured_skills' in app and app['structured_skills']:
            print(f"[{datetime.now()}]   ✓ Embedding {len(app['structured_skills'])} skills...")
            for skill in app['structured_skills']:
                skill_name = skill.get('skill_name', '')
                if skill_name:
                    normalized_name = _normalized_text(skill_name)
                    embedding = existing_skill_map.get(normalized_name)
                    if embedding is None:
                        embedding = encode_text(skill_name)
                    embeddings_data['skills_embeddings'].append({
                        "skill_name": skill_name,
                        "embedding": embedding
                    })
                    print(f"[{datetime.now()}]     - Embedded skill: {skill_name}")

        if not embeddings_data['skills_embeddings']:
            raw_skills_text = str(app.get('skills', '')).strip()
            if raw_skills_text:
                print(f"[{datetime.now()}]   ⚠️  Structured skills empty. Using raw skills text fallback embedding.")
                fallback_chunks = [chunk.strip() for chunk in raw_skills_text.split('.') if chunk.strip()]
                if not fallback_chunks:
                    fallback_chunks = [raw_skills_text]
                for chunk in fallback_chunks[:5]:
                    normalized_chunk = _normalized_text(chunk)
                    embedding = existing_skill_map.get(normalized_chunk)
                    if embedding is None:
                        embedding = encode_text(chunk)
                    embeddings_data['skills_embeddings'].append({
                        "skill_name": chunk,
                        "embedding": embedding
                    })
        
        # Process Constraints
        if 'structured_constraints' in app and app['structured_constraints']:
            print(f"[{datetime.now()}]   ✓ Embedding {len(app['structured_constraints'])} constraints...")
            for constraint in app['structured_constraints']:
                constraint_text = constraint.get('constraint_text', '')
                if constraint_text:
                    normalized_constraint = _normalized_text(constraint_text)
                    embedding = existing_constraint_map.get(normalized_constraint)
                    if embedding is None:
                        embedding = encode_text(constraint_text)
                    embeddings_data['constraints_embeddings'].append({
                        "constraint_text": constraint_text,
                        "embedding": embedding
                    })
                    print(f"[{datetime.now()}]     - Embedded constraint: {constraint_text}")

        if not embeddings_data['constraints_embeddings']:
            raw_pref_text = str(app.get('preferences', '')).strip()
            if raw_pref_text:
                print(f"[{datetime.now()}]   ⚠️  Structured constraints empty. Using preferences text fallback embedding.")
                normalized_pref = _normalized_text(raw_pref_text)
                embedding = existing_constraint_map.get(normalized_pref)
                if embedding is None:
                    embedding = encode_text(raw_pref_text)
                embeddings_data['constraints_embeddings'].append({
                    "constraint_text": raw_pref_text,
                    "embedding": embedding
                })
        
        # Process Qualification
        qualification = app.get('qualification', '')
        if qualification:
            print(f"[{datetime.now()}]   ✓ Embedding qualification: {qualification}")
            existing_qualification = existing_embedding_doc.get("qualification_embedding")
            existing_qualification_embedding = None
            if (
                isinstance(existing_qualification, dict)
                and _normalized_text(existing_embedding_doc.get("qualification_text", "")) == _normalized_text(qualification)
            ):
                existing_qualification_embedding = _embedding_list(existing_qualification.get("embedding"))
            embedding = existing_qualification_embedding or encode_text(qualification)
            embeddings_data['qualification_embedding'] = {
                "qualification": qualification,
                "embedding": embedding
            }
        
        # Process Location
        location = app.get('location', '')
        if location:
            print(f"[{datetime.now()}]   ✓ Embedding location: {location}")
            existing_location = existing_embedding_doc.get("location_embedding")
            existing_location_embedding = None
            if (
                isinstance(existing_location, dict)
                and _normalized_text(existing_embedding_doc.get("location_text", "")) == _normalized_text(location)
            ):
                existing_location_embedding = _embedding_list(existing_location.get("embedding"))
            embedding = existing_location_embedding or encode_text(location)
            embeddings_data['location_embedding'] = {
                "location": location,
                "embedding": embedding
            }
        
        # Store/Update embeddings
        result = js_embeddings_collection.update_one(
            {"user_id": user_id},
            {
                "$set": embeddings_data,
                "$setOnInsert": {"created_at": datetime.now()}
            },
            upsert=True
        )
        
        print(f"[{datetime.now()}]   ✅ Embeddings stored. Matched: {result.matched_count}, Upserted: {result.upserted_id}")
        print(f"[{datetime.now()}] embed_specific_job_seeker COMPLETE - user_id: {user_id}")
        return True
        
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Error embedding job seeker: {e}")
        print(f"[{datetime.now()}] Error type: {type(e).__name__}")
        traceback.print_exc()
        return False


def embed_specific_job_posting(user_id=None, posting_id=None):
    """
    Generate embeddings for a SPECIFIC job posting only.
    Called when a job provider updates their posting.
    
    Args:
        user_id: ObjectId or string of the job provider (fallback lookup)
        posting_id: ObjectId or string of the specific posting to embed
    """
    try:
        from bson import ObjectId

        print(
            f"[{datetime.now()}] embed_specific_job_posting START - "
            f"user_id: {user_id}, posting_id: {posting_id}"
        )
        
        collections = get_db()
        job_postings_collection = collections['postings']
        jp_embeddings_collection = collections['jp_embeddings']
        model_instance = None

        def encode_text(text):
            nonlocal model_instance
            if model_instance is None:
                model_instance = get_model()
            return model_instance.encode(text).tolist()
        
        posting_id_obj = None
        user_id_obj = None

        if posting_id is not None:
            posting_id_obj = ObjectId(posting_id) if isinstance(posting_id, str) else posting_id
            print(f"[{datetime.now()}] Resolved posting_id: {posting_id_obj}")

        if user_id is not None:
            user_id_obj = ObjectId(user_id) if isinstance(user_id, str) else user_id
            print(f"[{datetime.now()}] Resolved user_id: {user_id_obj}")

        # Prefer explicit posting lookup; fall back to provider lookup for legacy callers.
        posting = None
        if posting_id_obj is not None:
            posting = job_postings_collection.find_one({"_id": posting_id_obj})
        if posting is None and user_id_obj is not None:
            posting = job_postings_collection.find_one({"user_id": user_id_obj})
        
        if not posting:
            print(f"[{datetime.now()}] ⚠️  No posting found for user_id: {user_id} posting_id: {posting_id}")
            return False

        posting_id = posting['_id']
        posting_user_id = posting.get('user_id')
        print(f"[{datetime.now()}] [SELECTIVE] Embedding job posting: {posting_user_id}, posting_id: {posting_id}")
        existing_embedding_doc = jp_embeddings_collection.find_one({"posting_id": posting_id}) or {}
        existing_qualification_map = _build_existing_item_embedding_map(
            existing_embedding_doc.get("qualifications_embeddings", []), "qualification"
        )
        existing_requirement_map = _build_existing_item_embedding_map(
            existing_embedding_doc.get("job_requirements_embeddings", []), "requirement"
        )
        existing_benefit_map = _build_existing_item_embedding_map(
            existing_embedding_doc.get("benefits_embeddings", []), "benefit"
        )
        
        embeddings_data = {
            "posting_id": posting_id,
            "user_id": posting_user_id,
            "type": "job_posting",
            "jobTitle": posting.get('jobTitle', ''),
            "company": posting.get('companyName', ''),
            "jobDescription_text": posting.get('jobDescription', ''),
            "requiredQualifications_text": posting.get('requiredQualifications', ''),
            "benefits_text": posting.get('benefits', ''),
            "jobLocation_text": posting.get('jobLocation', ''),
            "jobType_text": posting.get('jobType', ''),
            "experienceRequired_text": posting.get('experienceRequired', ''),
            "jobTitle_embedding": [],
            "jobCategory_embedding": [],
            "experienceRequired_embedding": [],
            "jobLocation_embedding": [],
            "jobType_embedding": [],
            "qualifications_embeddings": [],
            "job_requirements_embeddings": [],
            "benefits_embeddings": [],
            "updated_at": datetime.now()
        }
        
        # Job Title
        job_title = posting.get('jobTitle', '')
        if job_title:
            print(f"[{datetime.now()}]   ✓ Embedding jobTitle: {job_title}")
            existing_title = existing_embedding_doc.get("jobTitle_embedding")
            existing_title_embedding = None
            if isinstance(existing_title, dict):
                old_title_text = _normalized_text(existing_title.get("jobTitle", ""))
                if old_title_text == _normalized_text(job_title):
                    existing_title_embedding = _embedding_list(existing_title.get("embedding"))
            embeddings_data['jobTitle_embedding'] = {
                "jobTitle": job_title,
                "embedding": existing_title_embedding or encode_text(job_title)
            }
        
        # Job Category
        job_category = posting.get('jobCategory', '')
        if job_category:
            print(f"[{datetime.now()}]   ✓ Embedding jobCategory: {job_category}")
            existing_category = existing_embedding_doc.get("jobCategory_embedding")
            existing_category_embedding = None
            if isinstance(existing_category, dict):
                old_category_text = _normalized_text(existing_category.get("jobCategory", ""))
                if old_category_text == _normalized_text(job_category):
                    existing_category_embedding = _embedding_list(existing_category.get("embedding"))
            embeddings_data['jobCategory_embedding'] = {
                "jobCategory": job_category,
                "embedding": existing_category_embedding or encode_text(job_category)
            }
        
        # Experience Required
        exp_required = posting.get('experienceRequired', '')
        if exp_required:
            print(f"[{datetime.now()}]   ✓ Embedding experienceRequired: {exp_required}")
            exp_required_text = str(exp_required)
            existing_experience = existing_embedding_doc.get("experienceRequired_embedding")
            existing_experience_embedding = None
            if isinstance(existing_experience, dict):
                old_experience_text = _normalized_text(existing_experience.get("experienceRequired", ""))
                if old_experience_text == _normalized_text(exp_required_text):
                    existing_experience_embedding = _embedding_list(existing_experience.get("embedding"))
            embeddings_data['experienceRequired_embedding'] = {
                "experienceRequired": exp_required,
                "embedding": existing_experience_embedding or encode_text(exp_required_text)
            }
        
        # Job Location
        job_location = posting.get('jobLocation', '')
        if job_location:
            print(f"[{datetime.now()}]   ✓ Embedding jobLocation: {job_location}")
            existing_location = existing_embedding_doc.get("jobLocation_embedding")
            existing_location_embedding = None
            if isinstance(existing_location, dict):
                old_location_text = _normalized_text(existing_location.get("jobLocation", ""))
                if old_location_text == _normalized_text(job_location):
                    existing_location_embedding = _embedding_list(existing_location.get("embedding"))
            embeddings_data['jobLocation_embedding'] = {
                "jobLocation": job_location,
                "embedding": existing_location_embedding or encode_text(job_location)
            }
        
        # Job Type
        job_type = posting.get('jobType', '')
        if job_type:
            print(f"[{datetime.now()}]   ✓ Embedding jobType: {job_type}")
            existing_type = existing_embedding_doc.get("jobType_embedding")
            existing_type_embedding = None
            if isinstance(existing_type, dict):
                old_type_text = _normalized_text(existing_type.get("jobType", ""))
                if old_type_text == _normalized_text(job_type):
                    existing_type_embedding = _embedding_list(existing_type.get("embedding"))
            embeddings_data['jobType_embedding'] = {
                "jobType": job_type,
                "embedding": existing_type_embedding or encode_text(job_type)
            }
        
        # Qualifications
        if 'structured_qualifications' in posting and posting['structured_qualifications']:
            print(f"[{datetime.now()}]   ✓ Embedding {len(posting['structured_qualifications'])} qualifications...")
            for qual in posting['structured_qualifications']:
                qual_text = qual.get('qualification', '')
                if qual_text:
                    normalized_qual = _normalized_text(qual_text)
                    embedding = existing_qualification_map.get(normalized_qual)
                    if embedding is None:
                        embedding = encode_text(qual_text)
                    embeddings_data['qualifications_embeddings'].append({
                        "qualification": qual_text,
                        "embedding": embedding
                    })
                    print(f"[{datetime.now()}]     - Embedded qualification: {qual_text}")

        if not embeddings_data['qualifications_embeddings']:
            raw_qualification = str(posting.get('requiredQualifications', '')).strip()
            if raw_qualification:
                print(f"[{datetime.now()}]   ⚠️  Structured qualifications empty. Using raw qualification fallback embedding.")
                normalized_raw_qualification = _normalized_text(raw_qualification)
                embedding = existing_qualification_map.get(normalized_raw_qualification)
                if embedding is None:
                    embedding = encode_text(raw_qualification)
                embeddings_data['qualifications_embeddings'].append({
                    "qualification": raw_qualification,
                    "embedding": embedding
                })
        
        # Job Requirements
        if 'structured_job_requirements' in posting and posting['structured_job_requirements']:
            print(f"[{datetime.now()}]   ✓ Embedding {len(posting['structured_job_requirements'])} job requirements...")
            for req in posting['structured_job_requirements']:
                req_text = req.get('requirement', '')
                if req_text:
                    normalized_req = _normalized_text(req_text)
                    embedding = existing_requirement_map.get(normalized_req)
                    if embedding is None:
                        embedding = encode_text(req_text)
                    embeddings_data['job_requirements_embeddings'].append({
                        "requirement": req_text,
                        "embedding": embedding
                    })
                    print(f"[{datetime.now()}]     - Embedded requirement: {req_text}")

        if not embeddings_data['job_requirements_embeddings']:
            raw_job_description = str(posting.get('jobDescription', '')).strip()
            if raw_job_description:
                print(f"[{datetime.now()}]   ⚠️  Structured job requirements empty. Using raw job description fallback embedding.")
                fallback_chunks = [chunk.strip() for chunk in raw_job_description.split('.') if chunk.strip()]
                if not fallback_chunks:
                    fallback_chunks = [raw_job_description]
                for chunk in fallback_chunks[:6]:
                    normalized_chunk = _normalized_text(chunk)
                    embedding = existing_requirement_map.get(normalized_chunk)
                    if embedding is None:
                        embedding = encode_text(chunk)
                    embeddings_data['job_requirements_embeddings'].append({
                        "requirement": chunk,
                        "embedding": embedding
                    })
        
        # Benefits
        if 'structured_benefits' in posting and posting['structured_benefits']:
            print(f"[{datetime.now()}]   ✓ Embedding {len(posting['structured_benefits'])} benefits...")
            for benefit in posting['structured_benefits']:
                benefit_text = benefit.get('benefit', '')
                if benefit_text:
                    normalized_benefit = _normalized_text(benefit_text)
                    embedding = existing_benefit_map.get(normalized_benefit)
                    if embedding is None:
                        embedding = encode_text(benefit_text)
                    embeddings_data['benefits_embeddings'].append({
                        "benefit": benefit_text,
                        "embedding": embedding
                    })
                    print(f"[{datetime.now()}]     - Embedded benefit: {benefit_text}")

        if not embeddings_data['benefits_embeddings']:
            raw_benefits = str(posting.get('benefits', '')).strip()
            if raw_benefits:
                print(f"[{datetime.now()}]   ⚠️  Structured benefits empty. Using raw benefits fallback embedding.")
                normalized_raw_benefits = _normalized_text(raw_benefits)
                embedding = existing_benefit_map.get(normalized_raw_benefits)
                if embedding is None:
                    embedding = encode_text(raw_benefits)
                embeddings_data['benefits_embeddings'].append({
                    "benefit": raw_benefits,
                    "embedding": embedding
                })
        
        # Store/Update embeddings
        result = jp_embeddings_collection.update_one(
            {"posting_id": posting_id},
            {
                "$set": embeddings_data,
                "$setOnInsert": {"created_at": datetime.now()}
            },
            upsert=True
        )
        print(f"[{datetime.now()}]   ✅ Embeddings stored. Matched: {result.matched_count}, Upserted: {result.upserted_id}")
        print(f"[{datetime.now()}] embed_specific_job_posting COMPLETE - user_id: {posting_user_id}, posting_id: {posting_id}")
        return True
        
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Error embedding job posting: {e}")
        print(f"[{datetime.now()}] Error type: {type(e).__name__}")
        traceback.print_exc()
        return False


def embed_job_seeker_data():
    """
    Generate embeddings for ALL job seekers (batch processing).
    Use this for bulk initialization only. For updates, use embed_specific_job_seeker().
    """
    print("\n" + "=" * 60)
    print("Processing Job Seeker Applications (BATCH)...")
    print("=" * 60)

    collections = get_db()
    model_instance = get_model()
    applications_collection = collections['applications']
    js_embeddings_collection = collections['js_embeddings']

    applications = list(applications_collection.find())

    for idx, app in enumerate(applications, 1):
        user_id = app.get('user_id')
        print(f"\n[{idx}/{len(applications)}] Processing application ID: {app['_id']}")

        app_id = app['_id']
        embeddings_data = {
            "application_id": app_id,
            "user_id": user_id,
            "type": "job_seeker",
            "name": app.get('name', ''),
            "email": app.get('email', ''),
            "skills_text": app.get('skills', ''),
            "preferences_text": app.get('preferences', ''),
            "qualification_text": app.get('qualification', ''),
            "location_text": app.get('location', ''),
            "skills_embeddings": [],
            "constraints_embeddings": [],
            "qualification_embedding": [],
            "location_embedding": {},
            "created_at": datetime.now()
        }

        # Process Skills
        if 'structured_skills' in app and app['structured_skills']:
            print(f"  Processing {len(app['structured_skills'])} skills...")
            for skill in app['structured_skills']:
                skill_name = skill.get('skill_name', '')
                if skill_name:
                    embedding = model_instance.encode(skill_name).tolist()
                    embeddings_data['skills_embeddings'].append({
                        "skill_name": skill_name,
                        "embedding": embedding
                    })
                    print(f"    ✓ Embedded skill: {skill_name}")

        # Process Constraints
        if 'structured_constraints' in app and app['structured_constraints']:
            print(f"  Processing {len(app['structured_constraints'])} constraints...")
            for constraint in app['structured_constraints']:
                constraint_text = constraint.get('constraint_text', '')
                if constraint_text:
                    embedding = model_instance.encode(constraint_text).tolist()
                    embeddings_data['constraints_embeddings'].append({
                        "constraint_text": constraint_text,
                        "embedding": embedding
                    })
                    print(f"    ✓ Embedded constraint: {constraint_text}")

        # Process Qualification
        qualification = app.get('qualification', '')
        if qualification:
            print(f"  Processing qualification: {qualification}")
            embedding = model_instance.encode(qualification).tolist()
            embeddings_data['qualification_embedding'] = {
                "qualification": qualification,
                "embedding": embedding
            }
            print(f"    ✓ Embedded qualification: {qualification}")

        # Process Location
        location = app.get('location', '')
        if location:
            print(f"  Processing location: {location}")
            embedding = model_instance.encode(location).tolist()
            embeddings_data['location_embedding'] = {
                "location": location,
                "embedding": embedding
            }
            print(f"    ✓ Embedded location: {location}")

        # Store/Update embeddings
        js_embeddings_collection.update_one(
            {"user_id": user_id} if user_id else {"application_id": app_id},
            {"$set": embeddings_data},
            upsert=True
        )
        print(f"  ✅ Saved embeddings for application {app_id}")



def embed_job_posting_data():
    """
    Generate embeddings for ALL job postings (batch processing).
    Use this for bulk initialization only. For updates, use embed_specific_job_posting().
    """
    print("\n" + "=" * 60)
    print("Processing Job Postings (BATCH)...")
    print("=" * 60)

    collections = get_db()
    model_instance = get_model()
    job_postings_collection = collections['postings']
    jp_embeddings_collection = collections['jp_embeddings']

    postings = list(job_postings_collection.find())

    for idx, posting in enumerate(postings, 1):
        print(f"\n[{idx}/{len(postings)}] Processing job posting ID: {posting['_id']}")

        posting_id = posting['_id']
        embeddings_data = {
            "posting_id": posting_id,
            "type": "job_posting",
            "jobTitle": posting.get('jobTitle', ''),
            "company": posting.get('companyName', ''),
            "jobDescription_text": posting.get('jobDescription', ''),
            "requiredQualifications_text": posting.get('requiredQualifications', ''),
            "benefits_text": posting.get('benefits', ''),
            "jobLocation_text": posting.get('jobLocation', ''),
            "jobType_text": posting.get('jobType', ''),
            "experienceRequired_text": posting.get('experienceRequired', ''),
            "jobTitle_embedding": [],
            "jobCategory_embedding": [],
            "experienceRequired_embedding": [],
            "jobLocation_embedding": [],
            "jobType_embedding": [],
            "qualifications_embeddings": [],
            "job_requirements_embeddings": [],
            "benefits_embeddings": [],
            "created_at": datetime.now()
        }

        # Job Title
        job_title = posting.get('jobTitle', '')
        if job_title:
            embeddings_data['jobTitle_embedding'] = {
                "jobTitle": job_title,
                "embedding": model_instance.encode(job_title).tolist()
            }
            print(f"  ✓ Embedded jobTitle: {job_title}")

        # Job Category
        job_category = posting.get('jobCategory', '')
        if job_category:
            embeddings_data['jobCategory_embedding'] = {
                "jobCategory": job_category,
                "embedding": model_instance.encode(job_category).tolist()
            }
            print(f"  ✓ Embedded jobCategory: {job_category}")

        # Experience Required
        exp_required = posting.get('experienceRequired', '')
        if exp_required:
            embeddings_data['experienceRequired_embedding'] = {
                "experienceRequired": exp_required,
                "embedding": model_instance.encode(str(exp_required)).tolist()
            }
            print(f"  ✓ Embedded experienceRequired: {exp_required}")

        # Job Location
        job_location = posting.get('jobLocation', '')
        if job_location:
            embeddings_data['jobLocation_embedding'] = {
                "jobLocation": job_location,
                "embedding": model_instance.encode(job_location).tolist()
            }
            print(f"  ✓ Embedded jobLocation: {job_location}")

        # Job Type
        job_type = posting.get('jobType', '')
        if job_type:
            embeddings_data['jobType_embedding'] = {
                "jobType": job_type,
                "embedding": model_instance.encode(job_type).tolist()
            }
            print(f"  ✓ Embedded jobType: {job_type}")

        # Qualifications
        if 'structured_qualifications' in posting and posting['structured_qualifications']:
            print(f"  Processing {len(posting['structured_qualifications'])} qualifications...")
            for qual in posting['structured_qualifications']:
                qual_text = qual.get('qualification', '')
                if qual_text:
                    embeddings_data['qualifications_embeddings'].append({
                        "qualification": qual_text,
                        "embedding": model_instance.encode(qual_text).tolist()
                    })
                    print(f"    ✓ Embedded qualification: {qual_text}")

        # Job Requirements
        if 'structured_job_requirements' in posting and posting['structured_job_requirements']:
            print(f"  Processing {len(posting['structured_job_requirements'])} job requirements...")
            for req in posting['structured_job_requirements']:
                req_text = req.get('requirement', '')
                if req_text:
                    embeddings_data['job_requirements_embeddings'].append({
                        "requirement": req_text,
                        "embedding": model_instance.encode(req_text).tolist()
                    })
                    print(f"    ✓ Embedded job requirement: {req_text}")

        # Benefits
        if 'structured_benefits' in posting and posting['structured_benefits']:
            print(f"  Processing {len(posting['structured_benefits'])} benefits...")
            for benefit in posting['structured_benefits']:
                benefit_text = benefit.get('benefit', '')
                if benefit_text:
                    embeddings_data['benefits_embeddings'].append({
                        "benefit": benefit_text,
                        "embedding": model_instance.encode(benefit_text).tolist()
                    })
                    print(f"    ✓ Embedded benefit: {benefit_text}")

        # Store/Update embeddings
        jp_embeddings_collection.update_one(
            {"posting_id": posting_id},
            {"$set": embeddings_data},
            upsert=True
        )
        print(f"  ✅ Saved embeddings for posting {posting_id}")


def main():
    """
    Main function to generate all embeddings (batch mode)
    """
    print("\n" + "=" * 60)
    print("VECTOR EMBEDDING SERVICE")
    print("Model: Sentence-BERT (all-MiniLM-L6-v2)")
    print("=" * 60)

    try:
        embed_job_seeker_data()
        embed_job_posting_data()

        print("\n" + "=" * 60)
        print("✅ ALL EMBEDDINGS GENERATED SUCCESSFULLY!")
        print("=" * 60)

        collections = get_db()
        js_embeddings_collection = collections['js_embeddings']
        jp_embeddings_collection = collections['jp_embeddings']

        seeker_embeddings = js_embeddings_collection.count_documents({"type": "job_seeker"})
        posting_embeddings = jp_embeddings_collection.count_documents({"type": "job_posting"})

        print("\nSummary:")
        print(f"  Job Seeker Applications with embeddings: {seeker_embeddings}")
        print(f"  Job Postings with embeddings: {posting_embeddings}")

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
