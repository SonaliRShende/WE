import os
import re
from flask import Flask, request, jsonify
from flask_cors import CORS 
from dotenv import load_dotenv
import bcrypt
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from deep_translator import GoogleTranslator
from openai import OpenAI

# Load environment variables for security
load_dotenv()

# --- Initialization ---
app = Flask(__name__)
# Enable CORS for development (allowing requests from your React app on a different port)
CORS(app) 

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
        else:
            raise ValueError("Invalid output_type")

        messages = [{"role": "user", "content": prompt}]
        completion = llm_client.chat.completions.create(
            model="deepseek/deepseek-chat-v3.1:free",
            messages=messages  # type: ignore
        )

        raw_text = completion.choices[0].message.content or ""
        raw_text = raw_text.strip()

        if output_type == "skills":
            return parse_skills(raw_text)
        else:
            return parse_constraints(raw_text)

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
        users_collection.insert_one(user_data)

        # return a success message.
        return jsonify({
            "message": "User registered successfully!",
            "user": {"name": name, "email": email}
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
        data = request.get_json()
        
        # 1. Basic Mandatory Field Validation
        if not data or not all(key in data for key in ['name', 'email', 'location']):
            return jsonify({"error": "Missing mandatory fields (name, email, location)"}), 400

        
        # 2. Process Skills
        skills_text = data.get('skills', '') 
        translated_skills = translate_to_english(skills_text)
        parsed_skills = query_deepseek(translated_skills, "skills")
        
        # 3. Process Constraints (from the 'preferences' field)
        preferences_text = data.get('preferences', '') 
        translated_constraints = translate_to_english(preferences_text)
        parsed_constraints = query_deepseek(translated_constraints, "constraints")
        
        # 4. Construct the Final Document for Insertion (Surgical Approach)
        
        # Create a new document that copies all relevant fields BUT the raw 'skills' and 'preferences'
        application_document = {
            "name": data.get('name', ''),
            "email": data.get('email', ''),
            "contact": data.get('contact', ''),
            "location": data.get('location', ''),
            "qualification": data.get('qualification', ''),
            "previousJob": data.get('previousJob', ''),
            "roles": data.get('roles', ''),
            "skillsApplied": data.get('skillsApplied', ''),
            "certifications": data.get('certifications', ''),
            "portfolio": data.get('portfolio', ''),
            "structured_skills": parsed_skills,
            "structured_constraints": parsed_constraints,
        }
            
        # 5. Store the final, single, complete document
        applications_collection.insert_one(application_document)
        
        # 6. Return Success
        return jsonify({
            "message": "Application processed successfully and data consolidated!", 
            "extracted_skills": parsed_skills, 
            "extracted_constraints": parsed_constraints
        }), 200

    except Exception as e:
        print(f"Server Error during application processing: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    # Run the Flask server on port 5000
    app.run(debug=True, port=5000)