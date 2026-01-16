import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from sentence_transformers import SentenceTransformer
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Sentence-BERT model
print("Loading Sentence-BERT model (all-MiniLM-L6-v2)...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Model loaded successfully!")

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
    exit()

db = mongo_client['skill_constraint_db']
applications_collection = db['job_applications']
job_postings_collection = db['job_postings']
js_embeddings_collection = db['JS_embeddings']  # Job seeker embeddings
jp_embeddings_collection = db['JP_embeddings']  # Job posting embeddings


def embed_job_seeker_data():
    """
    Generate embeddings for job seeker skills and constraints
    """
    print("\n" + "=" * 60)
    print("Processing Job Seeker Applications...")
    print("=" * 60)

    applications = list(applications_collection.find())

    for idx, app in enumerate(applications, 1):
        print(f"\n[{idx}/{len(applications)}] Processing application ID: {app['_id']}")

        app_id = app['_id']
        embeddings_data = {
            "application_id": app_id,
            "type": "job_seeker",
            "name": app.get('name', ''),
            "email": app.get('email', ''),
            "skills_embeddings": [],
            "constraints_embeddings": [],
            "created_at": datetime.now()
        }

        # Process Skills
        if 'structured_skills' in app and app['structured_skills']:
            print(f"  Processing {len(app['structured_skills'])} skills...")
            for skill in app['structured_skills']:
                skill_name = skill.get('skill_name', '')
                if skill_name:
                    embedding = model.encode(skill_name).tolist()
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
                    embedding = model.encode(constraint_text).tolist()
                    embeddings_data['constraints_embeddings'].append({
                        "constraint_text": constraint_text,
                        "embedding": embedding
                    })
                    print(f"    ✓ Embedded constraint: {constraint_text}")

        # Store/Update embeddings in MongoDB
        js_embeddings_collection.update_one(
            {"application_id": app_id},
            {"$set": embeddings_data},
            upsert=True
        )
        print(f"  ✅ Saved embeddings for application {app_id}")


def embed_job_posting_data():
    """
    Generate embeddings for job posting qualifications, job requirements, and benefits
    """
    print("\n" + "=" * 60)
    print("Processing Job Postings...")
    print("=" * 60)

    postings = list(job_postings_collection.find())

    for idx, posting in enumerate(postings, 1):
        print(f"\n[{idx}/{len(postings)}] Processing job posting ID: {posting['_id']}")

        posting_id = posting['_id']
        embeddings_data = {
            "posting_id": posting_id,
            "type": "job_posting",
            "jobTitle": posting.get('jobTitle', ''),
            "company": posting.get('companyName', ''),
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
                "embedding": model.encode(job_title).tolist()
            }
            print(f"  ✓ Embedded jobTitle: {job_title}")

        # Job Category
        job_category = posting.get('jobCategory', '')
        if job_category:
            embeddings_data['jobCategory_embedding'] = {
                "jobCategory": job_category,
                "embedding": model.encode(job_category).tolist()
            }
            print(f"  ✓ Embedded jobCategory: {job_category}")

        # Experience Required
        exp_required = posting.get('experienceRequired', '')
        if exp_required:
            embeddings_data['experienceRequired_embedding'] = {
                "experienceRequired": exp_required,
                "embedding": model.encode(str(exp_required)).tolist()
            }
            print(f"  ✓ Embedded experienceRequired: {exp_required}")

        # Job Location
        job_location = posting.get('jobLocation', '')
        if job_location:
            embeddings_data['jobLocation_embedding'] = {
                "jobLocation": job_location,
                "embedding": model.encode(job_location).tolist()
            }
            print(f"  ✓ Embedded jobLocation: {job_location}")

        # Job Type
        job_type = posting.get('jobType', '')
        if job_type:
            embeddings_data['jobType_embedding'] = {
                "jobType": job_type,
                "embedding": model.encode(job_type).tolist()
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
                        "embedding": model.encode(qual_text).tolist()
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
                        "embedding": model.encode(req_text).tolist()
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
                        "embedding": model.encode(benefit_text).tolist()
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
    Main function to generate all embeddings
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
