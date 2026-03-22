# AI-Driven Job Recommendation Platform: Detailed Working and Algorithm Explanation

## 1. Platform Overview

Our platform is a women-focused AI job recommendation system designed to do more than simple job matching. Most generic job portals recommend jobs mainly on keywords, job titles, or broad profile similarity. Our platform goes further by understanding:

- what a candidate can actually do
- what practical constraints the candidate has
- whether a job is realistically feasible
- why a job should or should not be recommended

This makes the platform especially useful for users who may have childcare responsibilities, mobility limitations, shift restrictions, location restrictions, safety concerns, remote-work preferences, or other real-life constraints that are often ignored by traditional recommenders.

The platform combines:

- multilingual text handling
- structured information extraction
- sentence embeddings
- constraint-aware recommendation logic
- explainable AI
- optional weakly supervised learning and graph-based extension

In this repository, the advanced recommendation engine is called **CARE-Net**:

**C**onstraint-**A**ware **R**easoning and **E**mbedding **Net**work

---

## 2. End-to-End Working of the Platform

## 2.1 User types in the platform

The platform has two main users:

1. **Job seeker**
   A woman looking for a suitable job based on her skills, qualifications, preferences, and constraints.

2. **Job provider**
   An employer or recruiter posting a job with requirements, qualifications, benefits, and location information.

---

## 2.2 Step-by-step workflow for a job seeker

### Step 1: Registration and login

The user first registers and logs in. Credentials are stored securely in MongoDB, and passwords are hashed using `bcrypt`.

### Step 2: Job seeker fills profile/application form

The job seeker submits:

- name and contact details
- location
- qualification
- previous job or role
- skills written in natural language
- preferences written in natural language

Example:

- Skills: "I can do tailoring, customer handling, and basic stitching"
- Preferences: "I cannot work after 7 PM and I need a job near home"

### Step 3: Multilingual normalization

If the text is in Hindi, Marathi, or another language, the backend translates it into English using `GoogleTranslator`.

Why this matters:

- candidates can write in their comfortable language
- the system still processes all users in one common semantic space
- multilingual inputs become comparable

### Step 4: Intelligent extraction of structure from free text

The system does not directly recommend on raw paragraphs. It first converts raw text into structured units using an LLM-based extraction layer.

For job seekers it extracts:

- `structured_skills`
- `structured_constraints`

For job providers it extracts:

- `structured_job_requirements`
- `structured_qualifications`
- `structured_benefits`

Examples:

- "I can stitch clothes and do embroidery" becomes skills like `Tailoring`, `Embroidery`
- "I cannot work after 7 PM" becomes a constraint like `cannot work after 7 PM`
- "Flexible hours and safe transport support" becomes benefits like `Flexible working hours`, `Safe transport support`

This step is important because clean structured items are much easier to match than long unstructured text.

### Step 5: Embedding generation

After structured extraction, the platform creates vector embeddings using the Sentence-BERT model `all-MiniLM-L6-v2`.

Separate embeddings are generated for:

- each seeker skill
- each seeker constraint
- seeker qualification
- seeker location
- each job requirement
- each job qualification
- each job benefit
- job title
- job category
- job type
- job location

These embeddings are stored in MongoDB collections:

- `JS_embeddings` for job seekers
- `JP_embeddings` for job postings

This design is better than making one single embedding for the whole profile because each part of the profile can then be matched independently.

### Step 6: Recommendation request

When the job seeker opens the dashboard, the frontend calls:

`/api/job-recommendations/<user_id>`

The backend then uses `CARE-Net` to score all available jobs for that user.

### Step 7: CARE-Net ranking

CARE-Net does not simply ask "Are these two texts similar?"

Instead it asks a much better question:

**"Is this job semantically relevant, practically feasible, constraint-compatible, and safe for this user?"**

After scoring, it returns:

- ranked job list
- skill score
- constraint score
- final job score
- explanation text

### Step 8: Dashboard display

The frontend shows:

- overall match percentage
- skill match percentage
- constraint match percentage
- explanation of why the job is recommended

This improves trust because users can understand the reason behind the recommendation.

---

## 2.3 Step-by-step workflow for a job provider

### Step 1: Job provider fills job posting form

The provider submits:

- job title
- company name
- job category
- job description
- experience required
- salary
- job location
- job type
- benefits
- required qualifications

### Step 2: Structured extraction

The backend extracts:

- job requirements
- qualifications
- benefits

### Step 3: Embedding generation

Embeddings are created for all structured parts of the job posting.

### Step 4: Candidate matching

For the provider dashboard, the platform currently uses a skill-centric matching endpoint:

`/api/matching-job-seekers/<user_id>`

This endpoint checks how well each seeker's skills cover the job requirements. It uses:

- cosine similarity between seeker skill embeddings and job requirement embeddings
- best-match-per-requirement logic
- coverage thresholding

This means the provider sees candidates whose skills actually cover a meaningful part of the job.

---

## 2.4 Cache and refresh mechanism

Recommendations are cached in the `job_scores` collection. Whenever:

- a job seeker updates profile data, or
- a job provider updates a job posting

the system invalidates cached recommendations so the next query reflects fresh data.

This keeps recommendations updated without recomputing everything on every single request.

---

## 3. Core Algorithms Used in the Platform

## 3.1 Algorithm 1: LLM-based information extraction

### Purpose

Convert free-form human language into structured machine-usable entities.

### What it extracts

- professional skills
- work constraints
- job requirements
- qualifications
- benefits

### Why we use it

If we directly compare raw text, the quality of recommendations drops because raw text contains noise, extra wording, and inconsistent phrasing.

Example:

- "I can sew dresses" and "Tailoring" mean nearly the same thing
- "Need school-hour-friendly schedule" and "Cannot work after 3 PM" may point to a schedule constraint

The extraction layer standardizes meaning first. This greatly improves downstream matching quality.

### Why it is better than keyword extraction

Keyword extraction alone fails when:

- the wording is informal
- the user writes in mixed language
- synonyms are used
- important ideas are implied instead of explicitly named

The LLM extraction layer is better because it maps natural sentences into consistent professional concepts.

---

## 3.2 Algorithm 2: Sentence embeddings using Sentence-BERT

### Model used

`all-MiniLM-L6-v2`

### Purpose

Convert text into dense semantic vectors so similar meanings are close in vector space.

### Why embeddings are important

Embeddings allow the platform to match:

- `Tailoring` with `Stitching`
- `Bookkeeping` with `Record maintenance`
- `Work from home` with `Remote`

This is much stronger than exact keyword matching.

### Why we chose Sentence-BERT over TF-IDF or bag-of-words

We use Sentence-BERT because:

1. it captures semantic meaning, not just exact words
2. it works better with short skill phrases and benefit phrases
3. it handles paraphrases much better
4. it is efficient enough for real systems

TF-IDF or bag-of-words would miss many semantically similar matches and would perform poorly on paraphrased job descriptions.

---

## 3.3 Baseline algorithm for comparison

The repository also contains a simpler baseline recommender based on weighted cosine matching.

At a high level:

- user skill and qualification embeddings are compared with job requirement and qualification embeddings
- constraint embeddings are compared with benefits, location, and job type
- final score is computed as:

`JobScore = 0.7 * SkillScore + 0.3 * ConstraintScore`

This baseline is useful for comparison, but it is still limited because it does not truly reason over feasibility conflicts, personalized weight shifts, or hard skill coverage requirements.

That is why the platform introduces CARE-Net.

---

## 3.4 Main algorithm: CARE-Net

CARE-Net is the main innovation of the platform.

It is a **hybrid recommendation algorithm** that combines:

- semantic similarity
- feasibility filtering
- attention over user constraints
- conflict detection
- dynamic weighting
- optional graph signal

Instead of only ranking by similarity, CARE-Net ranks by **useful suitability**.

---

## 4. Detailed Working of CARE-Net

## 4.1 Input representation

For each user, CARE-Net builds:

- user skill nodes
- user qualification node
- user constraint nodes
- user location node

For each job, CARE-Net builds:

- job title node
- job category node
- job requirement nodes
- qualification nodes
- benefit nodes
- job type node
- job location node
- experience node

Each node contains:

- text
- embedding vector
- feature type

This node-based representation is more powerful than one single profile vector because it preserves fine-grained structure.

---

## 4.2 Step A: Skill feasibility matching

This is the first major stage.

For each job skill node, CARE-Net finds the best matching user skill node:

`best_similarity(job_node_i) = max cosine(user_skill_j, job_node_i)`

Then it computes:

- `skill_score = mean(best_similarity(job_node_i))`
- `skill_coverage = fraction of job nodes whose similarity >= 0.45`

In the code, a job passes the skill gate only if:

- `skill_score >= 0.45`
- `skill_coverage >= 0.30`

### Why this improves accuracy

This step removes many false positives.

A cosine-only system may recommend a job because the overall profile text looks similar, even if the candidate does not actually cover enough required skills.

The skill gate solves that.

### Why this is better than average cosine similarity

Average cosine can be misleading because one strong term can dominate a weak profile. CARE-Net instead checks:

- whether the seeker has enough matching skills
- whether the job requirements are sufficiently covered

This makes recommendations more realistic.

---

## 4.3 Step B: Constraint attention mechanism

After skill feasibility is confirmed, CARE-Net studies user constraints.

It builds a support matrix between:

- user constraint embeddings
- job feature embeddings relevant to constraints

These job features include:

- benefits
- job type
- location
- requirement text
- title

The support matrix is:

`support_matrix = clip(constraint_matrix x feature_matrix^T, 0, 1)`

Then CARE-Net computes attention weights:

`attention_weights = softmax(support_matrix / temperature)`

with temperature = `0.35`.

This tells the model:

- which job feature is most relevant to each user constraint
- how strongly the job supports that specific need

It then computes:

- `attention_score`
- `constraint_score`

where the final constraint compatibility combines both attended support and strongest available support.

### Why this improves accuracy

Two jobs may have similar skill relevance, but one may better support:

- flexible timing
- safe transport
- remote work
- maternity support
- low-bandwidth remote workflow
- part-time schedules

Attention helps CARE-Net rank the more practically suitable one higher.

### Why attention is better than fixed matching

A fixed average treats all job fields equally. Attention lets the system focus on the most meaningful field for each specific constraint.

For example:

- for `remote-only`, job location and benefits matter most
- for `cannot work after 7 PM`, schedule and shift text matter most
- for `need safe transport`, benefits matter most

---

## 4.4 Step C: Location compatibility

CARE-Net separately evaluates location.

If the user prefers remote work:

- remote jobs get a very high location score
- non-remote jobs get a low score

If remote preference is not dominant, CARE-Net compares:

- seeker location embedding
- job location embedding

using cosine similarity.

### Why location is separated

Location is too important to bury inside a single generic similarity score. In real job matching, location can decide whether a job is practical or not.

---

## 4.5 Step D: Conflict detection

This is one of the biggest differences between our platform and ordinary recommenders.

CARE-Net actively detects contradictions between the user and the job.

Examples handled in code include:

- remote-only preference vs on-site job
- no weekend work vs weekend shift
- daytime-only preference vs night or evening shift
- cannot travel vs travel or relocation requirement
- accessibility-related need vs physically demanding work
- cannot work after a certain time vs a shift that ends later
- cannot work before a certain time vs a shift that starts too early

### How the algorithm works

The system uses:

- rule-based keyword detection
- text normalization
- time expression extraction
- semantic penalty boosting using embedding similarity

Penalty logic:

1. detect the type of conflict
2. assign a base penalty
3. strengthen penalty if semantic similarity confirms the conflict strongly
4. cap total penalty at `0.85`

### Why this improves accuracy

Traditional systems often recommend jobs that are semantically related but practically impossible.

Example:

- a user has nursing skills
- a night-shift hospital role is semantically relevant
- but the user has a childcare constraint and cannot work after 7 PM

A generic model may still rank that job high.

CARE-Net penalizes or rejects it.

This makes recommendations safer, more realistic, and more trustworthy.

---

## 4.6 Step E: Dynamic weight generation

Different users do not value the same factors equally.

Examples:

- a user with strong caregiving constraints may care more about flexibility than marginal skill similarity
- a user with very few skills may need skill feasibility to dominate
- a remote-only user needs location/job type signals to matter much more

So CARE-Net does not always use fixed weights.

### Rule-based hypernetwork style weights

If no trained model is loaded, CARE-Net uses a context-driven softmax weighting function based on:

- skill density
- constraint density
- remote preference
- schedule rigidity
- care-related need
- accessibility need
- location availability

This produces:

- `w_skill`
- `w_constraint`
- `w_location`

### Learned dynamic weight model

The repository also includes a trainable model called `DynamicWeightNet`.

It is a small MLP with:

- input: 9 user context features
- hidden layers with ReLU
- output: 3 weights
- softmax normalization

This means the system can learn personalized ranking weight patterns from data.

### Why this is better than fixed weights

Fixed weights assume all users are identical. That is not true in real life.

Dynamic weighting improves personalization and ranking accuracy because the importance of:

- skills
- constraints
- location

changes from one user to another.

---

## 4.7 Step F: Final CARE-Net score

After calculating all intermediate signals, CARE-Net combines them.

The actual scoring logic in code is:

`weighted_core = w_skill * skill_score + w_constraint * constraint_score + w_location * location_score`

`support_factor = 0.85 + 0.15 * attention_score`

`conflict_factor = 1 - 0.35 * conflict_penalty`

`match_synergy = 0.10 * min(skill_score, constraint_score)`

`raw_score = weighted_core * support_factor * conflict_factor + match_synergy + 0.03 * graph_signal`

`job_score = sigmoid(5 * (raw_score - 0.40))`

### What this means

- high skill score increases ranking
- high constraint compatibility increases ranking
- strong location compatibility increases ranking
- strong attention support slightly boosts confidence
- conflicts reduce the final score
- graph signal can add extra evidence if available
- sigmoid converts the score into a stable probability-like value between 0 and 1

### Why this formula is strong

It is hybrid. It does not rely on a single signal. This is exactly why it performs better in complex real-world matching.

---

## 4.8 Step G: Explanation generation

CARE-Net also explains each recommendation.

It uses:

- top matched skill pair
- most attended constraint-feature pair
- location evidence
- top conflict warning if one exists

Example explanation:

"Recommended because your Tailoring profile signal aligns with Tailoring and alteration and the constraint 'part-time role needed' is supported by the job feature 'part-time'."

### Why explanations matter

Accuracy is important, but user trust is also important. Explainable recommendations:

- make the system feel transparent
- help users understand the result
- support better decision-making

---

## 5. Training Algorithms Used for Improvement

## 5.1 Weak supervision and pseudo-label generation

A major challenge in real recommendation systems is the lack of labeled data.

We usually do not have manually labeled records saying:

- this job is suitable
- this one is not suitable
- this one violates a constraint

To solve this, the platform uses weak supervision.

### How pseudo labels are generated

A pair is treated as positive when:

- skill gate passes
- skill score is high
- conflict penalty is low
- constraint score or location score is acceptable

A pair is treated as negative when:

- skill gate fails
- conflict penalty is high
- skill score is too weak
- both skill and constraint support are weak

### Why we use weak supervision

We chose weak supervision because:

1. manual annotation is expensive
2. it lets us bootstrap a trainable model early
3. it is practical for student and research projects
4. it still supports meaningful experiments

### Why this is better than waiting for full labels

If we wait for perfect human labels, no model improvement happens early. Weak supervision allows training to begin immediately while keeping the system honest about the fact that these are proxy labels, not gold labels.

---

## 5.2 Dynamic weight learning model

The dynamic weight model is trained on pseudo-labeled user-job pairs.

### Inputs to the model

- user context vector
- pair features:
  - skill score
  - constraint score
  - location score
  - attention score
  - non-conflict score

### Training objective

The model predicts personalized weights and then computes a pair probability. It is trained using binary cross-entropy loss.

### Why we use this model

We want the ranking engine to learn how different user contexts change the importance of each factor.

This is better than:

- manual tuning only
- same formula for every user

---

## 5.3 Graph learning extension

The repository also contains a graph-based extension.

### Graph structure

Nodes:

- users
- jobs
- skills
- constraints
- locations

Edges:

- user has skill
- user has constraint
- user in location
- job requires skill
- job supports constraint
- job in location
- pseudo positive user-job match

### Model used

A lightweight relational graph encoder with relation-specific message passing.

### Why graph learning is useful

Graph learning can capture higher-order patterns such as:

- users with similar skill sets liking similar roles
- jobs sharing hidden structure through common requirement nodes
- beneficial links through shared locations and benefits

### Why graph is optional in this platform

Graph learning is powerful, but it needs:

- enough good-quality graph data
- reliable labels
- stable training

That is why the service only loads the graph artifact when its training accuracy is above a minimum threshold. This keeps the live system safe from weak graph models.

---

## 6. Why Our Platform Is Different from Other Job Recommendation Systems

Most standard job platforms do one of the following:

1. keyword search
2. simple cosine similarity between profile and job description
3. collaborative filtering based on clicks or applications
4. broad category matching

Our platform is different in several important ways.

### 6.1 It models real-life constraints explicitly

Most recommenders only ask:

- what skills do you have?

Our system asks:

- what skills do you have?
- what timings can you work?
- can you travel?
- do you need remote work?
- do you need safe transport?
- do you need school-hour-friendly scheduling?
- do you have accessibility or caregiving needs?

This makes the platform far more inclusive and practical.

### 6.2 It rejects infeasible jobs instead of merely lowering them slightly

Many systems still show impossible jobs somewhere in the ranking.

CARE-Net uses a **skill feasibility gate**, so clearly unsuitable jobs can be filtered out before final ranking.

### 6.3 It gives explanations

Most platforms only display "recommended for you."

Our platform explains:

- which skill matched
- which constraint was supported
- whether location compatibility was strong
- whether any caution exists

### 6.4 It is designed for cold-start settings

Collaborative filtering works best when there is a lot of interaction data. But job platforms often face:

- new users
- new job postings
- sparse application history

Our platform handles cold-start much better because it uses content, constraints, and embeddings from the beginning.

### 6.5 It supports multilingual and informal input

Many users do not describe their skills in perfectly formal English. Our system translates and normalizes these inputs before matching.

### 6.6 It combines symbolic reasoning with neural semantics

This is one of the strongest design choices.

The platform combines:

- neural embeddings for semantic understanding
- symbolic rules for conflict reasoning
- learned or context-driven dynamic weights for personalization

This hybrid approach is more reliable than using only one paradigm.

---

## 7. Why We Chose These Algorithms Instead of Other Algorithms

## 7.1 Why not only keyword matching?

Because keyword matching:

- misses synonyms
- fails on informal writing
- fails on multilingual variation
- cannot understand meaning

Sentence embeddings are much stronger semantically.

---

## 7.2 Why not only cosine similarity?

Cosine similarity is useful, but not enough.

It does not:

- enforce skill coverage
- detect contradictions
- personalize weights
- understand which user constraint matters most

That is why cosine similarity is used as a baseline and supporting component, not the final algorithm.

---

## 7.3 Why not collaborative filtering or matrix factorization?

These methods depend heavily on past interaction history.

In job recommendation, especially in a new platform, we face:

- new users with no prior clicks
- new jobs with no applications
- sparse and delayed feedback

This is the classic **cold-start problem**.

Our content-plus-constraint approach is better suited for this environment.

---

## 7.4 Why not classical ML classifiers only?

Algorithms like:

- decision tree
- random forest
- SVM
- logistic regression

can work if strong tabular features and labels exist. But they are weaker here because:

- job and profile text are highly unstructured
- semantic similarity matters
- constraints are nuanced
- explainable structured matching is needed

They can still be useful as auxiliary models, but not as the main recommender architecture.

---

## 7.5 Why not a pure end-to-end deep network?

A fully deep end-to-end model usually requires:

- large labeled datasets
- high compute
- stable training data
- lower need for interpretability

Our platform needs:

- practical implementation
- explainability
- good cold-start behavior
- strong performance even with limited labels

That is why a hybrid architecture is the better choice.

---

## 7.6 Why not pure GNN from the beginning?

Graph Neural Networks are powerful, but they need:

- reliable graph construction
- enough training signal
- sufficient positive/negative labels

In an early-stage platform, a pure GNN-first approach is risky. So we use graph learning as an optional extension instead of the only scoring engine.

This is a smart engineering choice because it balances:

- practicality
- interpretability
- research innovation

---

## 8. How the Chosen Algorithms Improve Accuracy

Accuracy improves because each stage removes a different kind of error.

### 8.1 Structured extraction reduces text noise

Free-text profiles are noisy. Turning them into structured skills and constraints reduces ambiguity and improves matching precision.

### 8.2 Embeddings improve semantic recall

Embeddings help retrieve semantically similar jobs even when exact words differ. This improves recall.

### 8.3 Skill feasibility gate reduces false positives

Jobs that look similar at the surface level but lack real skill coverage are filtered out. This improves precision.

### 8.4 Constraint attention improves ranking quality

Among jobs with similar skill match, the model can rank more suitable jobs higher by focusing on user constraints. This improves NDCG and MAP.

### 8.5 Conflict detection avoids impractical recommendations

Even semantically strong matches are penalized if they violate hard constraints. This improves trust and reduces unsafe recommendations.

### 8.6 Dynamic weights improve personalization

Not every user should be ranked with the same formula. Personalized weighting improves ranking accuracy for diverse users.

### 8.7 Weak supervision enables learning without expensive labels

It allows the system to move beyond manual heuristics and learn better weighting patterns from generated supervision.

### 8.8 Graph extension captures relational signals

When sufficiently trained, graph signals can improve ranking beyond direct pairwise similarity by using ecosystem-level structure.

---

## 9. Measurable Evidence from This Repository

The repository already contains experiment artifacts that show why CARE-Net is stronger.

### 9.1 Dataset scale used in the repository

From the saved split and training files:

- total seekers: **2015**
- total jobs: **1014**
- data split: **70% train / 15% validation / 15% test**

### 9.2 Proxy evaluation result: baseline vs CARE-Net

From `backend/models/evaluation/evaluation_test_sample.json` on a 20-user sampled test evaluation:

#### Baseline cosine recommender

- Precision@5 = **0.61**
- Recall@5 = **0.38125**
- NDCG@5 = **0.6179**
- MAP@5 = **0.3455**
- MRR = **0.7331**

#### CARE-Net

- Precision@5 = **0.97**
- Recall@5 = **0.6625**
- NDCG@5 = **1.00**
- MAP@5 = **0.6625**
- MRR = **1.00**

At `@10`, CARE-Net also reaches:

- Precision@10 = **0.755**
- Recall@10 = **1.00**
- NDCG@10 = **1.00**
- MAP@10 = **1.00**

### 9.3 Interpretation of those results

These numbers show that CARE-Net ranks relevant jobs much better than the cosine-only baseline in the saved proxy experiment.

This happens because CARE-Net is not fooled by superficial similarity. It adds:

- skill feasibility checking
- constraint reasoning
- better ranking among close candidates

### Important honesty

These results are marked in the repository as **proxy pseudo-label evaluation**, not final manual gold-standard evaluation.

So for a report or viva, you should present them honestly as:

- weakly supervised evaluation
- proxy evaluation

That is still valuable, but it should not be presented as fully human-annotated ground truth.

---

## 10. Evidence for the Learning Components

From `backend/models/quick_debug/research_training_summary.json`:

- training users used in the quick experiment: **50**
- validation users: **15**
- pseudo labels generated: **1940**
- dynamic weight model training accuracy: **0.8428**
- graph model training accuracy: **0.1572**

### What this means

The dynamic weight model looks promising in the quick experiment because it reached about **84.28%** training accuracy on the generated training samples.

The graph model is still weak in that quick debug run. That is why the system is designed carefully: it only loads graph artifacts if their training accuracy is above a reliability threshold.

This is good engineering practice because it prevents an unstable graph model from reducing recommendation quality.

---

## 11. Final Summary

Our platform is different because it does not treat job recommendation as only a text similarity problem.

It is a **constraint-aware, feasibility-aware, explainable, women-centered recommendation platform** that:

- understands unstructured multilingual input
- extracts structured skills and constraints
- converts them into semantic embeddings
- filters out infeasible jobs
- pays attention to user-specific constraints
- detects conflicts between user needs and job conditions
- personalizes ranking weights
- explains every recommendation

We chose this hybrid design because it is more practical, more inclusive, more accurate in cold-start conditions, and more explainable than keyword-based, cosine-only, or interaction-only recommenders.

In short:

**Other systems ask, "Is this job similar?"**

**Our system asks, "Is this job suitable, feasible, safe, and meaningful for this particular user?"**

That is the core reason our platform is stronger.

---

## 12. Main Files Where This Logic Is Implemented

- `backend/app.py`
- `backend/embedding_service.py`
- `backend/job_score_calculation.py`
- `backend/care_net.py`
- `backend/care_net_service.py`
- `backend/weak_supervision.py`
- `backend/dynamic_weight_learning.py`
- `backend/graph_learning.py`
- `backend/research_pipeline.py`
- `backend/evaluate_care_net.py`
- `frontend/src/pages/JobSeekerDashboard.jsx`
- `frontend/src/pages/JobProviderDashboard.jsx`
