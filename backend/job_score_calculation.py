import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize MongoDB connection
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
    exit()

db = mongo_client['skill_constraint_db']
js_embeddings_collection = db['JS_embeddings']   # Job seeker embeddings
jp_embeddings_collection = db['JP_embeddings']   # Job posting embeddings
job_scores_collection = db['job_scores']         # Store computed scores


def calculate_cosine_similarity(embedding1, embedding2):
    """
    Calculate cosine similarity between two embeddings.
    Both embeddings should be lists or numpy arrays.
    Returns similarity score between 0 and 1.
    """
    try:
        emb1 = np.array(embedding1).reshape(1, -1)
        emb2 = np.array(embedding2).reshape(1, -1)

        similarity = cosine_similarity(emb1, emb2)[0][0]
        return float(max(0, min(1, similarity)))

    except Exception as e:
        print(f"Error calculating cosine similarity: {e}")
        return 0.0


def calculate_skill_score(user_embeddings, job_embeddings):
    """
    Calculate skill match score using MAX pooling per skill.
    """
    if not user_embeddings or not job_embeddings:
        return 0.0

    per_skill_max_scores = []

    for user_skill in user_embeddings:
        user_embedding = user_skill.get('embedding', [])
        if not user_embedding:
            continue

        skill_similarities = []

        # Job requirements
        for job_req in job_embeddings.get('job_requirements_embeddings', []):
            job_emb = job_req.get('embedding', [])
            if job_emb:
                skill_similarities.append(
                    calculate_cosine_similarity(user_embedding, job_emb)
                )

        # Job title
        job_title_emb = job_embeddings.get('jobTitle_embedding', {})
        if job_title_emb and 'embedding' in job_title_emb:
            skill_similarities.append(
                calculate_cosine_similarity(user_embedding, job_title_emb['embedding'])
            )

        # Job category
        job_category_emb = job_embeddings.get('jobCategory_embedding', {})
        if job_category_emb and 'embedding' in job_category_emb:
            skill_similarities.append(
                calculate_cosine_similarity(user_embedding, job_category_emb['embedding'])
            )

        # Qualifications
        for qual in job_embeddings.get('qualifications_embeddings', []):
            qual_emb = qual.get('embedding', [])
            if qual_emb:
                skill_similarities.append(
                    calculate_cosine_similarity(user_embedding, qual_emb)
                )

        if skill_similarities:
            per_skill_max_scores.append(max(skill_similarities))

    return float(np.mean(per_skill_max_scores)) if per_skill_max_scores else 0.0


def calculate_constraint_score(user_constraints, job_embeddings, threshold=0.30):
    """
    Calculate constraint satisfaction score using noise-filtered averaging.
    """
    if not user_constraints or not job_embeddings:
        return 0.5

    per_constraint_scores = []

    for constraint in user_constraints:
        constraint_embedding = constraint.get('embedding', [])
        constraint_text = constraint.get('constraint_text', '').lower()

        if not constraint_embedding:
            continue

        similarity_values = []

        # Job location
        job_location_emb = job_embeddings.get('jobLocation_embedding', {})
        if job_location_emb and 'embedding' in job_location_emb:
            similarity_values.append(
                calculate_cosine_similarity(constraint_embedding, job_location_emb['embedding'])
            )

        # Job requirements
        for job_req in job_embeddings.get('job_requirements_embeddings', []):
            job_emb = job_req.get('embedding', [])
            if job_emb:
                sim = calculate_cosine_similarity(constraint_embedding, job_emb)

                requirement_text = job_req.get('requirement', '').lower()
                if any(word in constraint_text for word in ['after', 'before', 'evening', 'night', 'morning']):
                    if any(word in requirement_text for word in ['night', 'shift', 'evening', '24/7']):
                        sim = max(0, sim - 0.3)

                similarity_values.append(sim)

        # Benefits
        for benefit in job_embeddings.get('benefits_embeddings', []):
            benefit_emb = benefit.get('embedding', [])
            if benefit_emb:
                similarity_values.append(
                    calculate_cosine_similarity(constraint_embedding, benefit_emb)
                )

        # Job type
        job_type_emb = job_embeddings.get('jobType_embedding', {})
        if job_type_emb and 'embedding' in job_type_emb:
            similarity_values.append(
                calculate_cosine_similarity(constraint_embedding, job_type_emb['embedding'])
            )

        filtered_values = [v for v in similarity_values if v >= threshold]
        per_constraint_scores.append(np.mean(filtered_values) if filtered_values else 0.1)

    return float(np.mean(per_constraint_scores)) if per_constraint_scores else 0.5


def calculate_job_score(skill_score, constraint_score, weight_skill=0.7, weight_constraint=0.3):
    """
    Combine skill_score and constraint_score into final JobScore.
    """
    job_score = (weight_skill * skill_score) + (weight_constraint * constraint_score)
    return float(max(0, min(1, job_score)))


def generate_job_recommendations(user_id):
    """
    Generate ranked job recommendations for a user.
    """
    print("\n" + "=" * 60)
    print(f"Generating Job Recommendations for User: {user_id}")
    print("=" * 60)

    user_doc = js_embeddings_collection.find_one({"application_id": user_id})
    if not user_doc:
        print("❌ User embeddings not found")
        return []

    user_skills = user_doc.get('skills_embeddings', [])
    user_qualification = user_doc.get('qualification_embedding', [])
    user_constraints = user_doc.get('constraints_embeddings', [])
    user_location = user_doc.get('location_embedding', {})

    all_jobs = list(jp_embeddings_collection.find())
    job_scores_list = []

    # 1️⃣ Calculate scores for each job
    for job in all_jobs:
        combined_skill_embeddings = user_skills + ([user_qualification] if user_qualification else [])
        combined_constraints = user_constraints + ([user_location] if user_location else [])

        skill_score = calculate_skill_score(combined_skill_embeddings, job)
        constraint_score = calculate_constraint_score(combined_constraints, job)
        job_score = calculate_job_score(skill_score, constraint_score)

        job_scores_list.append({
            "job_id": job.get('posting_id'),
            "job_title": job.get('jobTitle', 'Unknown'),
            "company": job.get('company', 'Unknown'),
            "skill_score": skill_score,
            "constraint_score": constraint_score,
            "job_score": job_score
        })

    # 2️⃣ Rank jobs AFTER all scores are calculated
    ranked_jobs = sorted(job_scores_list, key=lambda x: x['job_score'], reverse=True)

    # 3️⃣ Print output in required format
    print("\n" + "-" * 60)
    print(f"User : {user_doc.get('name', 'Unknown User')}")
    print("-" * 60)

    for idx, job in enumerate(ranked_jobs, start=1):
        print(f"\n{idx}. Job Title : {job['job_title']}")
        print(f"   skill score : {job['skill_score']:.3f}")
        print(f"   constraints score : {job['constraint_score']:.3f}")
        print(f"   Job score : {job['job_score']:.3f}")

    # 4️⃣ Store results in DB
    job_scores_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "ranked_jobs": ranked_jobs,
            "generated_at": datetime.now(),
            "total_jobs_evaluated": len(ranked_jobs)
        }},
        upsert=True
    )

    return ranked_jobs


def main():
    print("\n" + "=" * 60)
    print("JOB SCORE CALCULATION SERVICE")
    print("=" * 60)

    for user in js_embeddings_collection.find():
        generate_job_recommendations(user.get('application_id'))


if __name__ == "__main__":
    main()
