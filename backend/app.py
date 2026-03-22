import os
import re
import importlib
from flask import Flask, request, jsonify
from flask_cors import CORS 
from dotenv import load_dotenv
import bcrypt
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from deep_translator import GoogleTranslator
from openai import OpenAI
import threading

# Load environment variables for security
load_dotenv()

# --- Initialization ---
app = Flask(__name__)
# CORS configuration for local and deployed frontends
frontend_origin = os.getenv("FRONTEND_ORIGIN")
allow_vercel_previews = os.getenv("ALLOW_VERCEL_PREVIEWS", "1").lower() in {"1", "true", "yes", "on"}

if frontend_origin:
    allowed_origins = [origin.strip() for origin in frontend_origin.split(",") if origin.strip()]
    cors_origins = allowed_origins[:]
    if allow_vercel_previews:
        cors_origins.append(r"https://.*\.vercel\.app")
    CORS(app, resources={r"/api/*": {"origins": cors_origins}})
else:
    CORS(app)


@app.get("/healthz")
def health_check():
    return jsonify({"status": "ok"}), 200


@app.get("/")
def root_health_check():
    return jsonify({"status": "ok", "service": "backend"}), 200

# Connect to MongoDB
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("❌ ERROR: MONGO_URI not found in .env file.")
    exit()

try:
    mongo_client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
    mongo_client.admin.command('ping')
    print("✅ Connected to MongoDB Atlas!")
except Exception as e:
    print("❌ MongoDB Connection failed:", e)
    
db = mongo_client['skill_constraint_db']
applications_collection = db['job_applications']
users_collection = db['users']


# Connect to OpenAI/OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    print("❌ ERROR: OPENROUTER_API_KEY not found in .env file.")
    exit()

llm_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY, 
)


def normalize_text(text):
    """
    Normalize text for comparison: strip whitespace and collapse internal whitespace.
    This prevents re-parsing due to minor formatting changes (extra spaces, line breaks, etc.)
    """
    if not text:
        return ""
    # Strip leading/trailing whitespace, collapse multiple spaces/newlines into single space
    return ' '.join(text.split())


def translate_to_english(text):
    if not text.strip():
        return ""
    try:
        return GoogleTranslator(source='auto', target='en').translate(text)
    except Exception as e:
        print(f"Translation Error: {e}")
        return text # Fallback to original text if translation fails



   
def parse_skills(text):
    """
    Converts plain text skills output to list of dicts:
    [{"skill_name": "tailoring"}, ...]
    Extracts only the value inside quotes.
    """
    skills = []
    matches = re.findall(r'- skill_name:\s*"([^"]+)"', text)
    for skill_name in matches:
        skills.append({"skill_name": skill_name.strip()})
    return skills

def parse_constraints(text):
    """
    Converts plain text constraints output to list of dicts:
    [{"constraint_text": "..."}]
    Extracts only the value inside quotes.
    """
    constraints = []
    matches = re.findall(r'- constraint_text:\s*"([^"]+)"', text)
    for c in matches:
        constraints.append({"constraint_text": c.strip()})
    return constraints

def parse_qualifications(text):
    """
    Converts plain text qualifications output to list of dicts:
    [{"qualification": "..."}]
    """
    qualifications = []
    matches = re.findall(r'- qualification:\s*"([^"]+)"', text)
    for q in matches:
        qualifications.append({"qualification": q.strip()})
    return qualifications

def parse_job_requirements(text):
    """
    Converts plain text job requirements output to list of dicts:
    [{"requirement": "..."}]
    """
    requirements = []
    matches = re.findall(r'- requirement:\s*"([^"]+)"', text)
    for r in matches:
        requirements.append({"requirement": r.strip()})
    return requirements

def parse_benefits(text):
    """
    Converts plain text benefits output to list of dicts:
    [{"benefit": "..."}]
    """
    benefits = []
    matches = re.findall(r'- benefit:\s*"([^"]+)"', text)
    for b in matches:
        benefits.append({"benefit": b.strip()})
    return benefits



def query_deepseek(text, output_type):
    # This function uses the llm_client initialized globally
    try:
        if output_type == "skills":
            prompt = f"""
You are a highly specialized and strict system for extracting professional skills.
Your task is to analyze the user's conversational text and translate all activities into **standard, Title Case, professional job skill nouns**.
**DO NOT** return verbs, adjectives, or casual language. Always use the most appropriate, professional terminology.
Text: "{text}"
Return plain text strictly like this:

skills:
- skill_name: "<skill1>"
- skill_name: "<skill2>"

Example: For "I can do tailoring and cooking", return:
skills:
- skill_name: "tailoring"
- skill_name: "cooking"

Example 2: For "I can do sewing cloths and I can bake cakes.", return:
skills:
- skill_name: "Tailoring"
- skill_name: "Pastry Arts / Baking"

Example 3: For "I'm really good at doing the bills and keeping track of all the money for my household, plus I can quickly fix up small scratches on wooden furniture, and I’ve been running the family’s social media pages since last year.", return:
skills:
- skill_name: "Bookkeeping / Personal Finance Management"
- skill_name: "Basic Carpentry / Furniture Restoration"
- skill_name: "Social Media Management"
"""
        elif output_type == "constraints":
            prompt = f"""
You are an assistant that extracts only work constraints from user text.
Text: "{text}"
Return plain text strictly like this:

constraints:
- constraint_text: "<constraint1>"
- constraint_text: "<constraint2>"

Example: For "I can't work after 7 pm", return:
constraints:
- constraint_text: "can't work after 7 pm"
"""
        elif output_type == "qualifications":
            prompt = f"""
You are an expert system for extracting required qualifications and certifications from job postings.
Extract education level, certifications, licenses, and specific qualifications mentioned.
Text: "{text}"
Return plain text strictly like this:

qualifications:
- qualification: "<qual1>"
- qualification: "<qual2>"

Example: For "Bachelor's degree in Computer Science or related field, PMP certification required, 5+ years experience", return:
qualifications:
- qualification: "Bachelor's degree in Computer Science or related field"
- qualification: "PMP certification"
- qualification: "5+ years professional experience"
"""
        elif output_type == "job_requirements":
            prompt = f"""
You are an expert system for extracting job requirements and responsibilities from job descriptions.
Extract key technical and soft skills required, responsibilities, and job duties.
Text: "{text}"
Return plain text strictly like this:

requirements:
- requirement: "<req1>"
- requirement: "<req2>"

Example: For "We need a developer who can work with Python, manage databases, and lead a team", return:
requirements:
- requirement: "Python development"
- requirement: "Database management"
- requirement: "Team leadership"
"""
        elif output_type == "benefits":
            prompt = f"""
You are an expert system for extracting employee benefits and perks from job postings.
Extract health insurance, retirement plans, flexible work arrangements, and other benefits.
Text: "{text}"
Return plain text strictly like this:

benefits:
- benefit: "<benefit1>"
- benefit: "<benefit2>"

Example: For "We offer health insurance, 401k matching, work from home flexibility, and 4 weeks PTO", return:
benefits:
- benefit: "Health insurance"
- benefit: "401k matching"
- benefit: "Work from home flexibility"
- benefit: "4 weeks paid time off"
"""
        else:
            raise ValueError("Invalid output_type")

        messages = [{"role": "user", "content": prompt}]
        completion = llm_client.chat.completions.create(
            model="deepseek/deepseek-chat-v3.1",
            messages=messages  # type: ignore
        )

        raw_text = completion.choices[0].message.content or ""
        raw_text = raw_text.strip()

        if output_type == "skills":
            return parse_skills(raw_text)
        elif output_type == "constraints":
            return parse_constraints(raw_text)
        elif output_type == "qualifications":
            return parse_qualifications(raw_text)
        elif output_type == "job_requirements":
            return parse_job_requirements(raw_text)
        elif output_type == "benefits":
            return parse_benefits(raw_text)

    except Exception as e:
        
        print(f"DeepSeek API Error for {output_type}: {e}")
        return []

# # Hardcoded input for testing
# test_skills_text = "मैं कपड़े सिल सकती हूँ और गाड़ी चला सकती हूँ।"

# # Call DeepSeek for skills
# deepseek_response = query_deepseek(test_skills_text, output_type="skills")

# # Print the raw DeepSeek response
# print("DeepSeek Raw Response:")
# print(deepseek_response)


# # Hardcoded input for testing constraints
# test_constraints_text = "I can't work after 7 pm"

# # Call DeepSeek for constraints
# deepseek_constraints_response = query_deepseek(test_constraints_text, output_type="constraints")

# # Print the raw DeepSeek response
# print("DeepSeek Constraints Response:")
# print(deepseek_constraints_response)

# test_skills_text = "मैं कपड़े सिल सकती हूँ और गाड़ी चला सकती हूँ।"
# translated_skills = translate_to_english(test_skills_text)
# print("Translated Skills Text:", translated_skills)
# parsed_skills = query_deepseek(translated_skills, "skills")
# print("Parsed Skills:", parsed_skills)


# def store_skills(parsed_skills):
#     if parsed_skills:
#         # Store a document for each application, associating extracted skills
#         skills_collection.insert_one({"extracted_skills": parsed_skills}) 

# def store_constraints(parsed_constraints):
#     if parsed_constraints:
#         # Store a document for each application, associating extracted constraints
#         constraints_collection.insert_one({"extracted_constraints": parsed_constraints}) 


# --- API Route for Frontend Integration ---

# app.py (Add this section after the query_deepseek function)
# -----------------------------------------------------------------
# --- User Authentication Routes ---
# -----------------------------------------------------------------

@app.route('/api/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not all([name, email, password]):
            return jsonify({"error": "Missing name, email, or password"}), 400

        # Check if user already exists
        if users_collection.find_one({"email": email}):
            return jsonify({"error": "User already exists with this email"}), 409

        # Hash the password for secure storage
        # 1. Encode the password string to bytes
        password_bytes = password.encode('utf-8')
        # 2. Generate a salt and hash the password
        hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
        
        # The result of hashpw is bytes, which PyMongo can store
        
        # Prepare the user document
        user_data = {
            "name": name,
            "email": email,
            "password": hashed_password # Storing the secure hash
        }

        # Insert the user into the database
        result = users_collection.insert_one(user_data)

        # return a success message with user ID
        return jsonify({
            "message": "User registered successfully!",
            "user": {"name": name, "email": email, "id": str(result.inserted_id)}
        }), 201

    except Exception as e:
        print(f"Registration Error: {e}")
        return jsonify({"error": "Internal server error during registration"}), 500


@app.route('/api/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not all([email, password]):
            return jsonify({"error": "Missing email or password"}), 400

        # Find the user by email
        user = users_collection.find_one({"email": email})

        if user:
            # Check the password
            # bcrypt.checkpw compares the raw password bytes with the stored hash bytes
            if bcrypt.checkpw(password.encode('utf-8'), user['password']):
                
                # Success! 
                return jsonify({
                    "message": "Login successful!",
                    "user": {"name": user['name'], "email": user['email'], "id": str(user['_id'])}
                }), 200
            else:
                # Password does not match
                return jsonify({"error": "Invalid email or password"}), 401
        else:
            # User not found
            return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        print(f"Login Error: {e}")
        return jsonify({"error": "Internal server error during login"}), 500

@app.route('/api/submit-application', methods=['POST'])
def submit_job_application():
    try:
        from bson import ObjectId
        from datetime import datetime
        
        data = request.get_json()
        user_id = data.get('user_id')
        
        # 1. Validate user_id
        if not user_id:
            return jsonify({"error": "User ID required. Please login first."}), 401
        
        # 2. Basic Mandatory Field Validation
        if not data or not all(key in data for key in ['name', 'email', 'location']):
            return jsonify({"error": "Missing mandatory fields (name, email, location)"}), 400

        
        # 3. Check if existing application exists
        existing_app = applications_collection.find_one({"user_id": ObjectId(user_id)})
        existing_skills = existing_app.get('skills', '') if existing_app else ''
        existing_preferences = existing_app.get('preferences', '') if existing_app else ''
        
        new_skills = data.get('skills', '')
        new_preferences = data.get('preferences', '')
        
        # Check if skills or constraints changed (using normalized comparison to ignore formatting)
        skills_changed = (normalize_text(new_skills) != normalize_text(existing_skills))
        constraints_changed = (normalize_text(new_preferences) != normalize_text(existing_preferences))
        
        # Only call DeepSeek if skills/constraints actually changed
        if skills_changed:
            skills_text = new_skills
            translated_skills = translate_to_english(skills_text)
            parsed_skills = query_deepseek(translated_skills, "skills")
            print(f"[JOB SEEKER] Skills changed - DeepSeek called. Parsed: {parsed_skills}")
        else:
            # Reuse existing structured skills
            parsed_skills = existing_app.get('structured_skills', []) if existing_app else []
            print(f"[JOB SEEKER] Skills unchanged - skipping DeepSeek. Using old: {parsed_skills}")
        
        if constraints_changed:
            preferences_text = new_preferences
            translated_constraints = translate_to_english(preferences_text)
            parsed_constraints = query_deepseek(translated_constraints, "constraints")
            print(f"[JOB SEEKER] Constraints changed - DeepSeek called. Parsed: {parsed_constraints}")
        else:
            # Reuse existing structured constraints
            parsed_constraints = existing_app.get('structured_constraints', []) if existing_app else []
            print(f"[JOB SEEKER] Constraints unchanged - skipping DeepSeek. Using old: {parsed_constraints}")
        
        # 4. Construct the Update Document
        update_document = {
            "name": data.get('name', ''),
            "email": data.get('email', ''),
            "contact": data.get('contact', ''),
            "location": data.get('location', ''),
            "profile_pic": data.get('profile_pic', None),
            "qualification": data.get('qualification', ''),
            "previousJob": data.get('previousJob', ''),
            "roles": data.get('roles', ''),
            "skillsApplied": data.get('skillsApplied', ''),
            "certifications": data.get('certifications', ''),
            "portfolio": data.get('portfolio', ''),
            "preferences": new_preferences,
            "skills": new_skills,
            "structured_skills": parsed_skills,
            "structured_constraints": parsed_constraints,
            "updated_at": datetime.now()
        }
            
        # 5. Use upsert to update if exists, insert if new
        result = applications_collection.update_one(
            {"user_id": ObjectId(user_id)},
            {
                "$set": update_document,
                "$setOnInsert": {"created_at": datetime.now()}
            },
            upsert=True
        )
        
        message = "Application created successfully!" if result.upserted_id else "Application updated successfully!"
        invalidate_job_seeker_recommendations(user_id)
        
        # Trigger embedding service in background to update embeddings after saving
        try:
            import traceback
            from datetime import datetime

            def run_seeker_embeddings():
                try:
                    print(f"[{datetime.now()}] Starting seeker embedding for user_id: {user_id}")
                    embedding_service = importlib.import_module("embedding_service")
                    result = embedding_service.embed_specific_job_seeker(user_id)
                    print(f"[{datetime.now()}] Seeker embedding completed. Result: {result}")
                    if result:
                        # AFTER embedding is done, invalidate all job seeker recommendations
                        # so they see updated matching jobs in their next query
                        invalidate_all_job_seeker_recommendations()
                        print(f"[{datetime.now()}] Invalidated recommendations for updated seeker")
                except Exception as ee:
                    print(f"[{datetime.now()}] ❌ Background seeker embedding error: {ee}")
                    traceback.print_exc()

            embedding_thread = threading.Thread(target=run_seeker_embeddings, daemon=True)
            embedding_thread.start()
            print(f"[{datetime.now()}] Seeker embedding thread started for user: {user_id}")
        except Exception as e:
            print(f"[{datetime.now()}] ❌ Could not start embedding_service for seeker: {e}")
            import traceback
            traceback.print_exc()

        # 6. Return Success with change tracking info
        return jsonify({
            "message": message, 
            "extracted_skills": parsed_skills, 
            "extracted_constraints": parsed_constraints,
            "skills_reprocessed": skills_changed,
            "constraints_reprocessed": constraints_changed
        }), 200

    except Exception as e:
        print(f"Server Error during application processing: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/get-job-seeker-application/<user_id>', methods=['GET'])
def get_job_seeker_application(user_id):
    """
    Fetch job seeker application for a specific user
    """
    try:
        from bson import ObjectId
        
        application = applications_collection.find_one({"user_id": ObjectId(user_id)})
        
        if not application:
            return jsonify({"application": None}), 200
        
        # Convert ObjectIds to strings for JSON serialization
        application['_id'] = str(application['_id'])
        application['user_id'] = str(application['user_id'])
        
        return jsonify({"application": application}), 200
    except Exception as e:
        print(f"Error fetching application: {e}")
        return jsonify({"error": str(e)}), 500


def invalidate_all_job_seeker_recommendations():
    """
    Clear all cached recommendations in job_scores collection
    Called when a new job posting is added/updated to force recalculation for all job seekers
    """
    try:
        db_instance = mongo_client['skill_constraint_db']
        job_scores_collection = db_instance['job_scores']
        result = job_scores_collection.delete_many({})
        print(f"✅ Cache invalidated: Deleted {result.deleted_count} recommendation(s)")
    except Exception as e:
        print(f"⚠️  Error invalidating cache: {e}")


def invalidate_job_seeker_recommendations(user_id):
    """
    Clear cached recommendations for a specific job seeker.
    Called when that seeker's profile changes.
    """
    try:
        from bson import ObjectId

        db_instance = mongo_client['skill_constraint_db']
        job_scores_collection = db_instance['job_scores']
        user_id_obj = ObjectId(user_id) if isinstance(user_id, str) else user_id
        result = job_scores_collection.delete_many({"user_id": user_id_obj})
        print(f"Cache invalidated for seeker {user_id}: Deleted {result.deleted_count} recommendation(s)")
    except Exception as e:
        print(f"Error invalidating seeker cache: {e}")


def invalidate_job_provider_recommendations(user_id):
    """
    Clear cached recommendations for a specific job provider
    Called when a new job seeker applies to force recalculation
    """
    try:
        from bson import ObjectId
        db_instance = mongo_client['skill_constraint_db']
        # Note: Job providers typically use different endpoints, but if they cache their matched seekers,
        # this would invalidate it
        print(f"✅ Cache invalidated for provider {user_id}")
    except Exception as e:
        print(f"⚠️  Error invalidating provider cache: {e}")


def get_latest_recommendation_source_timestamp():
    """
    Return the newest timestamp from embedding collections.
    If this is newer than a cached recommendation, the cache should be regenerated.
    
    NOTE:
    Recommendations are computed from embedding collections (JS_embeddings/JP_embeddings),
    so freshness must be based on embedding update timestamps rather than raw profile/posting
    timestamps. This avoids regenerating recommendations with stale embeddings.
    """
    try:
        db_instance = mongo_client['skill_constraint_db']
        timestamp_sources = [
            ("JS_embeddings", ("updated_at", "created_at")),
            ("JP_embeddings", ("updated_at", "created_at")),
        ]
        timestamps = []

        for collection_name, field_names in timestamp_sources:
            for field_name in field_names:
                latest_doc = db_instance[collection_name].find_one(
                    {field_name: {"$exists": True}},
                    sort=[(field_name, -1)],
                    projection={field_name: 1},
                )
                latest_value = latest_doc.get(field_name) if latest_doc else None
                if latest_value is not None:
                    timestamps.append(latest_value)

        return max(timestamps) if timestamps else None
    except Exception as e:
        print(f"Error checking recommendation freshness: {e}")
        return None


@app.route('/api/job-recommendations/<user_id>', methods=['GET'])
def get_job_recommendations(user_id):
    """
    Fetch personalized job recommendations for a user
    """
    try:
        from bson import ObjectId
        from care_net_service import generate_job_recommendations
        
        # Check if recommendations exist and are recent (less than 24 hours old)
        from datetime import datetime, timedelta
        result = None
        
        # Convert string user_id to ObjectId for DB lookups
        try:
            user_id_obj = ObjectId(user_id)
        except Exception as e:
            return jsonify({"error": f"Invalid user_id format: {user_id}"}), 400
        
        existing_result = None
        try:
            # Try to get existing recommendations
            db_instance = mongo_client['skill_constraint_db']
            job_scores_collection = db_instance['job_scores']
            existing_result = job_scores_collection.find_one({"user_id": user_id_obj})
        except:
            pass
        
        # Check if we should regenerate (if not exists or too old)
        should_regenerate = True
        if existing_result:
            generated_at = existing_result.get('generated_at')
            if generated_at:
                age = datetime.now() - generated_at
                latest_source_timestamp = get_latest_recommendation_source_timestamp()
                source_is_stale = (
                    latest_source_timestamp is not None and latest_source_timestamp > generated_at
                )
                if age < timedelta(hours=24) and not source_is_stale:
                    should_regenerate = False
                    result = existing_result
        
        if should_regenerate:
            # Generate fresh recommendations (pass string user_id, function will convert)
            ranked_jobs = generate_job_recommendations(user_id)
            if 'job_scores_collection' in locals():
                refreshed_result = job_scores_collection.find_one({"user_id": user_id_obj})
                if refreshed_result:
                    result = refreshed_result
                else:
                    result = {
                        "user_id": str(user_id_obj),
                        "ranked_jobs": ranked_jobs,
                        "generated_at": datetime.now(),
                        "total_jobs_evaluated": len(ranked_jobs)
                    }
            else:
                result = {
                    "user_id": str(user_id_obj),
                    "ranked_jobs": ranked_jobs,
                    "generated_at": datetime.now(),
                    "total_jobs_evaluated": len(ranked_jobs)
                }
        
        if result:
            # Convert everything to JSON-serializable format
            response_data = {}
            
            # Handle user_id
            if 'user_id' in result:
                response_data['user_id'] = str(result['user_id'])
            
            # Handle _id
            if '_id' in result:
                response_data['_id'] = str(result['_id'])
            
            # Handle ranked_jobs
            if 'ranked_jobs' in result:
                ranked_jobs = result['ranked_jobs']
                if isinstance(ranked_jobs, list):
                    response_data['ranked_jobs'] = ranked_jobs
                else:
                    response_data['ranked_jobs'] = []
            else:
                response_data['ranked_jobs'] = []
            
            # Handle generated_at
            if 'generated_at' in result and result['generated_at']:
                if hasattr(result['generated_at'], 'isoformat'):
                    response_data['generated_at'] = result['generated_at'].isoformat()
                else:
                    response_data['generated_at'] = str(result['generated_at'])
            
            # Handle total_jobs_evaluated
            if 'total_jobs_evaluated' in result:
                response_data['total_jobs_evaluated'] = result['total_jobs_evaluated']

            if 'algorithm' in result:
                response_data['algorithm'] = result['algorithm']

            if 'recommended_jobs' in result:
                response_data['recommended_jobs'] = result['recommended_jobs']

            if 'rejected_by_skill_gate' in result:
                response_data['rejected_by_skill_gate'] = result['rejected_by_skill_gate']
            
            return jsonify(response_data), 200
        else:
            return jsonify({"ranked_jobs": [], "message": "No recommendations available yet"}), 200
            
    except Exception as e:
        print(f"Error fetching recommendations: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/generate-embeddings/<user_id>', methods=['POST'])
def generate_embeddings_for_user(user_id):
    """
    Generate embeddings for a specific user after form submission
    """
    try:
        # Delegate embedding work to embedding_service to avoid duplicate logic
        from bson import ObjectId
        from datetime import datetime

        # Run embedding_service in a background thread to avoid blocking the request
        def run_embeddings():
            try:
                embedding_service = importlib.import_module("embedding_service")
                embedding_service.embed_specific_job_seeker(user_id)
            except Exception as ee:
                print(f"Background embedding error: {ee}")

        threading.Thread(target=run_embeddings, daemon=True).start()

        # After triggering, return a queued response — client can call this endpoint again to poll
        return jsonify({"message": "Embedding job for user queued. Processing in background."}), 202

    except Exception as e:
        print(f"Error delegating embeddings: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/submit-job-posting', methods=['POST'])
def submit_job_posting():
    try:
        from bson import ObjectId
        from datetime import datetime
        
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        if not all(key in data for key in ['jobTitle', 'companyName', 'jobLocation']):
            return jsonify({"error": "Missing mandatory fields"}), 400
        
        # Check if existing job posting exists
        db_instance = mongo_client['skill_constraint_db']
        job_postings_collection = db_instance['job_postings']
        existing_posting = job_postings_collection.find_one({"user_id": ObjectId(user_id)})
        
        existing_job_desc = existing_posting.get('jobDescription', '') if existing_posting else ''
        existing_qualif = existing_posting.get('requiredQualifications', '') if existing_posting else ''
        existing_benefits = existing_posting.get('benefits', '') if existing_posting else ''
        
        new_job_desc = data.get('jobDescription', '')
        new_qualif = data.get('requiredQualifications', '')
        new_benefits = data.get('benefits', '')
        
        # Check if job requirements, qualifications, or benefits changed (using normalized comparison)
        job_desc_changed = (normalize_text(new_job_desc) != normalize_text(existing_job_desc))
        qualif_changed = (normalize_text(new_qualif) != normalize_text(existing_qualif))
        benefits_changed = (normalize_text(new_benefits) != normalize_text(existing_benefits))
        
        # Only call DeepSeek if they actually changed
        if job_desc_changed:
            job_req_text = new_job_desc
            translated_req = translate_to_english(job_req_text)
            parsed_requirements = query_deepseek(translated_req, "job_requirements")
            print(f"[JOB PROVIDER] Job description changed - DeepSeek called. Parsed: {parsed_requirements}")
        else:
            parsed_requirements = existing_posting.get('structured_job_requirements', []) if existing_posting else []
            print(f"[JOB PROVIDER] Job description unchanged - skipping DeepSeek. Using old: {parsed_requirements}")
        
        if qualif_changed:
            qualif_text = new_qualif
            translated_qualif = translate_to_english(qualif_text)
            parsed_qualifications = query_deepseek(translated_qualif, "qualifications")
            print(f"[JOB PROVIDER] Qualifications changed - DeepSeek called. Parsed: {parsed_qualifications}")
        else:
            parsed_qualifications = existing_posting.get('structured_qualifications', []) if existing_posting else []
            print(f"[JOB PROVIDER] Qualifications unchanged - skipping DeepSeek. Using old: {parsed_qualifications}")
        
        if benefits_changed:
            benefits_text = new_benefits
            translated_benefits = translate_to_english(benefits_text)
            parsed_benefits = query_deepseek(translated_benefits, "benefits")
            print(f"[JOB PROVIDER] Benefits changed - DeepSeek called. Parsed: {parsed_benefits}")
        else:
            parsed_benefits = existing_posting.get('structured_benefits', []) if existing_posting else []
            print(f"[JOB PROVIDER] Benefits unchanged - skipping DeepSeek. Using old: {parsed_benefits}")
        
        job_posting_document = {
            "user_id": ObjectId(user_id),
            "name": data.get('name', ''),
            "age": data.get('age', ''),
            "phoneNumber": data.get('phoneNumber', ''),
            "email": data.get('email', ''),
            "jobTitle": data.get('jobTitle', ''),
            "companyName": data.get('companyName', ''),
            "company_logo": data.get('company_logo', None),
            "jobCategory": data.get('jobCategory', ''),
            "jobDescription": new_job_desc,
            "experienceRequired": data.get('experienceRequired', ''),
            "salaryMin": data.get('salaryMin', ''),
            "salaryMax": data.get('salaryMax', ''),
            "salaryType": data.get('salaryType', 'yearly'),
            "jobLocation": data.get('jobLocation', ''),
            "jobType": data.get('jobType', 'full-time'),
            "benefits": new_benefits,
            "applicationDeadline": data.get('applicationDeadline', ''),
            "requiredQualifications": new_qualif,
            "structured_job_requirements": parsed_requirements,
            "structured_qualifications": parsed_qualifications,
            "structured_benefits": parsed_benefits,
            "updated_at": datetime.now()
        }
        
        result = job_postings_collection.update_one(
            {"user_id": ObjectId(user_id)},
            {
                "$set": job_posting_document,
                "$setOnInsert": {"created_at": datetime.now()}
            },
            upsert=True
        )
        
        message = "Job posting created!" if result.upserted_id else "Job posting updated!"
        embedding_refreshed = False
        
        # Refresh posting embeddings immediately when possible, then fall back to a background retry.
        try:
            import traceback
            from datetime import datetime

            def run_posting_embeddings():
                try:
                    print(f"[{datetime.now()}] Starting job posting embedding for user_id: {user_id}")
                    embedding_service = importlib.import_module("embedding_service")
                    result = embedding_service.embed_specific_job_posting(user_id)
                    print(f"[{datetime.now()}] Job posting embedding completed. Result: {result}")
                    if result:
                        # AFTER embedding is done, invalidate all job seeker recommendations
                        # so they see the new job posting in their next query
                        invalidate_all_job_seeker_recommendations()
                        print(f"[{datetime.now()}] Invalidated recommendations after new job posting")
                except Exception as ee:
                    print(f"[{datetime.now()}] ❌ Background posting embedding error: {ee}")
                    traceback.print_exc()

            embedding_thread = threading.Thread(target=run_posting_embeddings, daemon=True)
            embedding_thread.start()
            print(f"[{datetime.now()}] Job posting embedding thread started for user: {user_id}")
        except Exception as e:
            print(f"[{datetime.now()}] ❌ Could not start embedding_service for posting: {e}")
            import traceback
            traceback.print_exc()

        return jsonify({
            "message": message,
            "extracted_requirements": parsed_requirements,
            "extracted_qualifications": parsed_qualifications,
            "extracted_benefits": parsed_benefits,
            "job_description_reprocessed": job_desc_changed,
            "qualifications_reprocessed": qualif_changed,
            "benefits_reprocessed": benefits_changed,
            "posting_embedding_refreshed": embedding_refreshed
        }), 200
        
    except Exception as e:
        print(f"Error submitting job posting: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/get-job-posting/<user_id>', methods=['GET'])
def get_job_posting(user_id):
    """Fetch job provider's posting"""
    try:
        from bson import ObjectId
        
        db_instance = mongo_client['skill_constraint_db']
        job_postings_collection = db_instance['job_postings']
        
        posting = job_postings_collection.find_one({"user_id": ObjectId(user_id)})
        
        if not posting:
            return jsonify({"posting": None}), 200
        
        posting['_id'] = str(posting['_id'])
        posting['user_id'] = str(posting['user_id'])
        
        return jsonify({"posting": posting}), 200
    except Exception as e:
        print(f"Error fetching job posting: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/get-job-posting-by-id/<job_id>', methods=['GET'])
def get_job_posting_by_id(job_id):
    """Fetch job posting details by job ID (for job seekers to view recommendations)"""
    try:
        from bson import ObjectId
        
        db_instance = mongo_client['skill_constraint_db']
        jp_embeddings_collection = db_instance['JP_embeddings']
        job_postings_collection = db_instance['job_postings']

        try:
            object_id = ObjectId(job_id)
        except Exception:
            object_id = None

        def serialize_posting(document):
            serialized = dict(document)
            for field in ('_id', 'user_id', 'posting_id', 'application_id'):
                if field in serialized and serialized[field] is not None:
                    serialized[field] = str(serialized[field])
            return serialized

        embedding_posting = None
        direct_posting = None

        if object_id:
            embedding_posting = jp_embeddings_collection.find_one({"_id": object_id})
            if not embedding_posting:
                embedding_posting = jp_embeddings_collection.find_one({"posting_id": object_id})

            direct_posting = job_postings_collection.find_one({"_id": object_id})

        if not embedding_posting:
            embedding_posting = jp_embeddings_collection.find_one({"posting_id": job_id})

        if direct_posting:
            return jsonify({"posting": serialize_posting(direct_posting)}), 200

        if not embedding_posting:
            return jsonify({"posting": None}), 200

        linked_posting = None
        linked_posting_id = embedding_posting.get('posting_id')

        if isinstance(linked_posting_id, ObjectId):
            linked_posting = job_postings_collection.find_one({"_id": linked_posting_id})
        elif isinstance(linked_posting_id, str):
            try:
                linked_posting = job_postings_collection.find_one({"_id": ObjectId(linked_posting_id)})
            except Exception:
                linked_posting = None

        resolved_posting = linked_posting or embedding_posting

        return jsonify({"posting": serialize_posting(resolved_posting)}), 200
    except Exception as e:
        print(f"Error fetching job posting by ID: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/matching-job-seekers/<user_id>', methods=['GET'])
def get_matching_job_seekers(user_id):
    """
    Find all job seekers matching this job posting
    Uses embeddings to calculate match scores
    """
    try:
        from bson import ObjectId
        import numpy as np
        
        db_instance = mongo_client['skill_constraint_db']
        jp_embeddings_collection = db_instance['JP_embeddings']
        js_embeddings_collection = db_instance['JS_embeddings']
        
        # Get the job posting embeddings (contains job_requirements_embeddings, qualifications_embeddings, etc.)
        posting = jp_embeddings_collection.find_one({"user_id": ObjectId(user_id)})
        if not posting:
            return jsonify({"error": "Job posting not found"}), 404
        
        # Get only job seeker embeddings
        all_seekers = list(js_embeddings_collection.find(
            {"type": "job_seeker"},
            projection={
                "user_id": 1,
                "name": 1,
                "email": 1,
                "skills_embeddings": 1,
            },
        ))
        
        if not all_seekers:
            return jsonify({
                "job_title": posting.get('jobTitle'),
                "company": posting.get('company'),
                "total_matches": 0,
                "matches": []
            }), 200
        
        matches = []
        skill_match_threshold = 0.45
        coverage_threshold = 0.30
        
        # Extract job requirements embeddings (from JP_embeddings)
        job_requirements = posting.get('job_requirements_embeddings', [])
        job_qualifications = posting.get('qualifications_embeddings', [])

        job_requirement_vectors = []
        for req in job_requirements:
            req_vec = req.get('embedding')
            if req_vec:
                job_requirement_vectors.append(np.array(req_vec, dtype=float))

        if not job_requirement_vectors:
            return jsonify({
                "job_title": posting.get('jobTitle'),
                "company": posting.get('company'),
                "total_matches": 0,
                "matches": []
            }), 200

        job_matrix = np.vstack(job_requirement_vectors)
        job_norms = np.linalg.norm(job_matrix, axis=1, keepdims=True)
        job_matrix = job_matrix / np.clip(job_norms, 1e-8, None)
        
        # Calculate match score for each seeker
        for seeker in all_seekers:
            seeker_skills = seeker.get('skills_embeddings', [])
            
            if not seeker_skills:
                continue

            seeker_vectors = []
            for seeker_skill in seeker_skills:
                seeker_embedding = seeker_skill.get('embedding')
                if seeker_embedding:
                    seeker_vectors.append(np.array(seeker_embedding, dtype=float))

            if not seeker_vectors:
                continue

            seeker_matrix = np.vstack(seeker_vectors)
            seeker_norms = np.linalg.norm(seeker_matrix, axis=1, keepdims=True)
            seeker_matrix = seeker_matrix / np.clip(seeker_norms, 1e-8, None)

            similarity_matrix = np.matmul(job_matrix, seeker_matrix.T)
            best_scores_per_requirement = np.max(similarity_matrix, axis=1).tolist()

            if not best_scores_per_requirement:
                continue

            matched_requirements = [
                score for score in best_scores_per_requirement if score >= skill_match_threshold
            ]
            coverage = len(matched_requirements) / len(best_scores_per_requirement)
            if coverage < coverage_threshold:
                continue

            avg_skill_match = np.mean(best_scores_per_requirement)
            
            matches.append({
                "seeker_id": str(seeker.get('user_id')),
                "seeker_name": seeker.get('name'),
                "seeker_email": seeker.get('email'),
                "match_score": round(float(avg_skill_match) * 100, 2),
                "skills_count": len(seeker_skills),
                "skill_coverage": round(float(coverage) * 100, 2)
            })
        
        # Sort by match score descending
        matches = sorted(matches, key=lambda x: x['match_score'], reverse=True)
        
        return jsonify({
            "job_title": posting.get('jobTitle'),
            "company": posting.get('company'),
            "total_matches": len(matches),
            "matches": matches
        }), 200
        
    except Exception as e:
        print(f"Error finding matching seekers: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/check-embeddings/<user_id>', methods=['GET'])
def check_embeddings_status(user_id):
    """
    Check if embeddings have been generated and stored for a user
    Useful for debugging and monitoring embedding generation
    """
    try:
        from bson import ObjectId
        from datetime import datetime
        
        # Check if user_id is valid ObjectId
        try:
            obj_id = ObjectId(user_id)
        except:
            return jsonify({"error": "Invalid user_id format"}), 400
        
        db_instance = mongo_client['skill_constraint_db']
        js_embeddings_collection = db_instance['JS_embeddings']
        jp_embeddings_collection = db_instance['JP_embeddings']
        applications_collection = db_instance['job_applications']
        job_postings_collection = db_instance['job_postings']
        
        # Check job seeker embeddings
        seeker_embedding = js_embeddings_collection.find_one({"user_id": obj_id})
        seeker_app = applications_collection.find_one({"user_id": obj_id})
        
        # Check job posting embeddings
        posting_embedding = jp_embeddings_collection.find_one({"user_id": obj_id})
        posting_data = job_postings_collection.find_one({"user_id": obj_id})
        
        response = {
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
            "seeker_application": {
                "exists": seeker_app is not None,
                "last_updated": str(seeker_app.get('updated_at')) if seeker_app else None,
                "has_structured_skills": bool(seeker_app.get('structured_skills')) if seeker_app else False,
                "has_structured_constraints": bool(seeker_app.get('structured_constraints')) if seeker_app else False
            },
            "seeker_embeddings": {
                "exists": seeker_embedding is not None,
                "created_at": str(seeker_embedding.get('created_at')) if seeker_embedding else None,
                "has_skills_embeddings": bool(seeker_embedding.get('skills_embeddings')) if seeker_embedding else False,
                "has_constraints_embeddings": bool(seeker_embedding.get('constraints_embeddings')) if seeker_embedding else False,
                "has_qualification_embedding": bool(seeker_embedding.get('qualification_embedding')) if seeker_embedding else False,
                "has_location_embedding": bool(seeker_embedding.get('location_embedding')) if seeker_embedding else False
            },
            "job_posting": {
                "exists": posting_data is not None,
                "last_updated": str(posting_data.get('updated_at')) if posting_data else None,
                "has_structured_qualifications": bool(posting_data.get('structured_qualifications')) if posting_data else False,
                "has_structured_job_requirements": bool(posting_data.get('structured_job_requirements')) if posting_data else False,
                "has_structured_benefits": bool(posting_data.get('structured_benefits')) if posting_data else False
            },
            "job_posting_embeddings": {
                "exists": posting_embedding is not None,
                "created_at": str(posting_embedding.get('created_at')) if posting_embedding else None,
                "has_jobTitle_embedding": bool(posting_embedding.get('jobTitle_embedding')) if posting_embedding else False,
                "has_qualifications_embeddings": bool(posting_embedding.get('qualifications_embeddings')) if posting_embedding else False,
                "has_job_requirements_embeddings": bool(posting_embedding.get('job_requirements_embeddings')) if posting_embedding else False,
                "has_benefits_embeddings": bool(posting_embedding.get('benefits_embeddings')) if posting_embedding else False
            }
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Error checking embeddings: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Run the Flask server using platform-provided port in production
    debug_mode = os.getenv("FLASK_DEBUG", "1").lower() in {"1", "true", "yes", "on"}
    use_reloader = os.getenv("FLASK_USE_RELOADER", "0").lower() in {"1", "true", "yes", "on"}
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=debug_mode, use_reloader=use_reloader)
