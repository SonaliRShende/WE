# CARE-Net: Constraint-Aware Reasoning and Embedding Network

This project extends the current women-focused AI job recommendation platform with a research-oriented hybrid recommender named CARE-Net. The goal is not only to rank jobs by semantic similarity, but to reason over feasibility, personal constraints, conflict signals, and dynamic user priorities.

## 1. System Architecture

### 1.1 End-to-end pipeline

1. React frontend
   - Job seeker profile form
   - Job provider posting form
   - Recommendation dashboard with explanations

2. Flask API layer
   - Authentication
   - Profile submission
   - Job posting submission
   - Recommendation retrieval
   - Embedding generation triggers

3. Information extraction layer
   - Translate multilingual text to English when needed
   - Extract structured skills from free text
   - Extract structured constraints from user preferences
   - Extract structured requirements, qualifications, and benefits from job posts

4. Embedding layer
   - SentenceTransformer encodes skills, constraints, job requirements, benefits, and locations
   - Embeddings stored in MongoDB
   - FAISS can be added for candidate generation before ranking

5. CARE-Net ranking layer
   - Skill feasibility filter
   - Constraint attention mechanism
   - Constraint conflict detection
   - Dynamic weight generation
   - Hybrid score computation
   - Explanation synthesis

6. Persistence layer
   - MongoDB for transactional and structured data
   - Optional FAISS index for retrieval acceleration
   - Optional graph store or graph collection for heterogeneous relationships

7. Evaluation and experimentation layer
   - Offline ranking metrics
   - Ablation studies
   - Baseline comparison against cosine-only recommender
   - Fairness analysis for constraint-heavy users

### 1.2 Research-grade deployment view

Recommended collections:

- `users`
- `job_applications`
- `job_postings`
- `JS_embeddings`
- `JP_embeddings`
- `job_scores`
- `interaction_logs`
- `care_net_experiments`
- `graph_edges` (optional)

Recommended services:

- `Extraction Service`
- `Embedding Service`
- `Candidate Retrieval Service`
- `CARE-Net Ranking Service`
- `Explanation Service`
- `Evaluation Service`

### 1.3 Online serving flow

1. User submits profile.
2. Backend extracts skills and constraints.
3. Embedding service creates user embeddings.
4. Candidate retriever fetches top-K jobs using ANN search over job requirement embeddings.
5. CARE-Net reranks those K candidates.
6. Explanations are attached to each ranked result.
7. Recommendations are cached in MongoDB.

## 2. CARE-Net Algorithm Design

### 2.1 Inputs

For user `u`:

- skill embeddings `E_skill(u)`
- qualification embedding `E_qual(u)`
- constraint embeddings `E_const(u)`
- location embedding `E_loc(u)`
- optional profile context vector

For job `j`:

- title embedding `E_title(j)`
- requirement embeddings `E_req(j)`
- qualification embeddings `E_qual_req(j)`
- benefit embeddings `E_benefit(j)`
- job type embedding `E_type(j)`
- location embedding `E_job_loc(j)`

### 2.2 Step-by-step inference

#### Step A. Candidate retrieval

Use FAISS or cosine pre-filtering to retrieve top-K jobs from the embedding space. This reduces the search space before expensive reasoning.

#### Step B. Skill feasibility filter

For each job requirement node, compute the best similarity against the user's skill nodes.

- `SkillMatch = mean(max_sim(job_requirement_i, user_skill_set))`
- `SkillCoverage = fraction of job requirement nodes above threshold tau_skill`

Reject the job if:

- `SkillMatch < tau_skill`, or
- `SkillCoverage < tau_cover`

This avoids recommending jobs that fit constraints but are not realistically achievable.

#### Step C. Constraint attention

Build a matrix of job features relevant to constraints:

- location
- job type
- benefits
- schedule-related requirements
- work arrangement signals

For each user constraint embedding:

- `A = softmax(E_const(u) x JobFeatureMatrix^T / T)`

This tells the model which job features matter most for each constraint.

#### Step D. Constraint compatibility

Use the attention output to compute an attended compatibility score:

- `ConstraintCompatibility = mean(weighted_similarity(constraint_i, attended_job_features))`

#### Step E. Constraint conflict detection

Detect contradictions between user constraints and job text.

Examples:

- cannot work after 7 PM vs shift 7-10 PM
- remote only vs on-site office job
- no weekend work vs weekend availability required
- disability or mobility limitation vs lifting/standing-heavy role
- cannot travel vs frequent field travel

Conflict detection can combine:

- rule-based semantic parsing
- embedding similarity
- optional LLM verification for edge cases

Produce:

- `ConflictPenalty in [0,1]`
- conflict explanation text

#### Step F. Dynamic weight learning

Generate personalized weights from the user context:

- `w_skill`
- `w_constraint`
- `w_location`

In a full research setup, this is learned by a hypernetwork or lightweight MLP:

- `w = softmax(H(user_context))`

Example behavior:

- a user with strong caregiving constraints gets higher `w_constraint`
- a user with relocation sensitivity gets higher `w_location`
- a user with sparse skills gets higher `w_skill`

#### Step G. Hybrid scoring

The CARE-Net hybrid score is:

`Score(u,j) = Attention(u_constraints, j_features) * (w1 * SkillMatch + w2 * ConstraintCompatibility + w3 * LocationScore + w4 * GraphSignal) * (1 - ConflictPenalty)`

Then:

`P(recommend | u,j) = sigmoid(alpha * (Score(u,j) - beta))`

#### Step H. Explanation generation

For the final top jobs, generate evidence from:

- top matched skill pair
- most-attended constraint-feature pair
- location compatibility
- any cautions from conflicts

Example:

`This job is recommended because your tailoring skill aligns with the role requirements and the job supports your daytime availability.`

## 3. CARE-Net Pseudocode

```text
function CARE_NET_RANK(user, jobs):
    user_skill_nodes = extract_user_skills(user)
    user_constraint_nodes = extract_user_constraints(user)
    user_context = build_context_vector(user)

    personalized_weights = softmax(HyperNetwork(user_context))

    ranked_results = []

    for job in jobs:
        job_skill_nodes = extract_job_skill_nodes(job)
        job_constraint_nodes = extract_constraint_features(job)

        skill_match = mean_over_job_nodes(max_similarity(job_skill_node, user_skill_nodes))
        skill_coverage = fraction_above_threshold(job_skill_nodes, user_skill_nodes, tau_skill)

        if skill_match < tau_skill or skill_coverage < tau_cover:
            continue

        attention_weights = softmax(user_constraint_embeddings x job_constraint_matrix / temperature)
        attention_score = attended_similarity(attention_weights, user_constraint_embeddings, job_constraint_matrix)

        constraint_compatibility = aggregate_constraint_support(user_constraint_nodes, job_constraint_nodes)
        location_score = compare_location_and_remote_preference(user, job)
        conflict_penalty, conflict_reasons = detect_conflicts(user_constraint_nodes, job)
        graph_signal = optional_graph_score(user, job)

        raw_score = attention_score * (
            personalized_weights.skill * skill_match
            + personalized_weights.constraint * constraint_compatibility
            + personalized_weights.location * location_score
            + 0.05 * graph_signal
        ) * (1 - conflict_penalty)

        probability = sigmoid(alpha * (raw_score - beta))

        explanation = build_explanation(user, job, conflict_reasons)

        ranked_results.append({
            job_id,
            probability,
            skill_match,
            constraint_compatibility,
            location_score,
            conflict_penalty,
            explanation
        })

    return sort_descending(ranked_results, key=probability)
```

## 4. Current Implementation in This Repository

Implemented files:

- `backend/care_net.py`
- `backend/care_net_service.py`
- `backend/dynamic_weight_learning.py`
- `backend/weak_supervision.py`
- `backend/graph_learning.py`
- `backend/research_pipeline.py`
- `backend/embedding_service.py`
- `frontend/src/pages/JobSeekerDashboard.jsx`

What the implementation already does:

- uses sentence-transformer embeddings already produced by the backend
- applies a skill-feasibility rejection gate
- computes constraint attention over job features
- detects semantic conflicts with time, remote, weekend, travel, and accessibility rules
- supports both rule-based and learned dynamic weights
- generates pseudo labels when human labels are unavailable
- trains a lightweight dynamic-weight model with weak supervision
- builds a heterogeneous user-job-skill-constraint-location graph
- trains a lightweight relational graph encoder for user-job link scoring
- injects the learned graph signal into CARE-Net when graph artifacts are available
- returns explainable recommendation text

### 4.1 Weak supervision strategy

Because manually labeled user-job relevance data is often unavailable in a student or early-stage research setting, this project uses pseudo labels.

Pseudo positive examples:

- high skill match
- high constraint compatibility
- low conflict penalty
- acceptable location compatibility

Pseudo negative examples:

- rejected by skill feasibility filter
- high conflict penalty
- weak match despite semantic similarity

This lets the project remain research-worthy without claiming access to expensive human annotations.

### 4.2 Training entrypoint

Run:

```bash
python backend/create_experiment_splits.py
python backend/research_pipeline.py
```

This will:

- read user and job embedding documents from MongoDB
- generate pseudo labels
- train the dynamic weight model
- train the graph model
- save artifacts under `backend/models/`

### 4.3 Evaluation workflow

Recommended experiment order:

```bash
python backend/create_experiment_splits.py
python backend/research_pipeline.py --split-path backend/models/data_splits.json
python backend/evaluate_care_net.py --split test --split-path backend/models/data_splits.json
python backend/create_manual_gold_set.py --split test --split-path backend/models/data_splits.json
```

After manual annotation is completed, run:

```bash
python backend/evaluate_care_net.py --split test --split-path backend/models/data_splits.json --labels-path backend/models/manual_gold_labels.json
```

This gives you two evaluation modes:

- proxy evaluation using pseudo labels
- final evaluation using manually annotated gold labels

## 5. Recommended Dataset Structure

### 5.1 User profile document

```json
{
  "_id": "user_id",
  "name": "Asha",
  "location": "Pune",
  "qualification": "Diploma in Fashion Design",
  "skills": [
    "Tailoring",
    "Embroidery",
    "Customer Communication"
  ],
  "constraints": [
    "cannot work after 7 PM",
    "prefers work near home",
    "needs daytime schedule due to childcare"
  ],
  "experience_years": 2,
  "remote_preference": false,
  "employment_preference": ["part-time", "flexible"],
  "languages": ["English", "Hindi", "Marathi"]
}
```

### 5.2 Job posting document

```json
{
  "_id": "job_id",
  "jobTitle": "Boutique Tailoring Assistant",
  "companyName": "Urban Threads",
  "jobLocation": "Pune",
  "jobType": "part-time",
  "jobDescription": "Support boutique tailoring operations during daytime hours.",
  "requiredSkills": [
    "Tailoring",
    "Basic Stitching",
    "Customer Handling"
  ],
  "requiredQualifications": [
    "Diploma in tailoring or equivalent experience"
  ],
  "benefits": [
    "Flexible daytime work",
    "Safe workplace",
    "Nearby local commute"
  ],
  "schedule_text": "10 AM to 5 PM",
  "remote_allowed": false
}
```

### 5.3 Derived embedding document

```json
{
  "user_id": "user_id",
  "skills_embeddings": [
    { "skill_name": "Tailoring", "embedding": [0.12, 0.44, ...] }
  ],
  "constraints_embeddings": [
    { "constraint_text": "cannot work after 7 PM", "embedding": [0.03, 0.65, ...] }
  ],
  "location_embedding": {
    "location": "Pune",
    "embedding": [0.23, 0.19, ...]
  }
}
```

### 5.4 Interaction log for learning

```json
{
  "user_id": "user_id",
  "job_id": "job_id",
  "impression_timestamp": "2026-03-16T10:20:00",
  "clicked": 1,
  "applied": 1,
  "saved": 0,
  "dismissed": 0,
  "hired": 0
}
```

This interaction table is essential if you want to train the dynamic weight generator or future graph model.

## 6. Evaluation Metrics

Primary ranking metrics:

- Precision@K
- Recall@K
- NDCG@K
- MAP@K
- MRR

Calibration and classification metrics:

- ROC-AUC
- PR-AUC
- Brier score

Constraint-specific metrics:

- Constraint Violation Rate
- Conflict Detection Precision / Recall
- Skill Feasibility Rejection Accuracy
- Safe Recommendation Rate

Operational metrics:

- latency per query
- recall after FAISS candidate generation
- cache hit rate

Fairness and inclusion metrics:

- performance by constraint category
- performance by skill density group
- false-positive rate for highly constrained users

## 7. Experimental Design and Baselines

### 7.1 Main baseline

Baseline recommender:

- embed user skill text and job description
- compute cosine similarity
- rank descending

### 7.2 Stronger ablations

1. Cosine only
2. Skill filter + cosine
3. Skill filter + constraint compatibility
4. Skill filter + attention
5. Skill filter + attention + conflict penalty
6. Full CARE-Net

This ablation sequence makes the innovation measurable.

### 7.3 Hypotheses

- H1: CARE-Net improves NDCG@10 over cosine-only baseline.
- H2: CARE-Net lowers constraint-violation rate significantly.
- H3: CARE-Net improves recommendation trust through explanations.
- H4: Dynamic weighting improves performance for users with multiple constraints.

## 8. How to Present the Innovation

### 8.1 Core novelty claim

The novelty is that CARE-Net does not treat job recommendation as pure semantic similarity. It introduces feasibility gating, constraint-aware attention, conflict reasoning, and personalized weight generation in one hybrid framework.

### 8.2 Suggested presentation structure

1. Problem statement
   - women job seekers often have legitimate constraints not handled by generic recommenders

2. Gap in existing systems
   - cosine similarity can rank semantically similar but practically infeasible jobs

3. Proposed method
   - CARE-Net block diagram
   - mathematical formulation
   - attention and conflict reasoning examples

4. System architecture
   - frontend, backend, embeddings, vector store, ranking engine, database

5. Experimental setup
   - dataset
   - train/validation/test split
   - baselines
   - metrics

6. Results
   - table comparing cosine baseline vs CARE-Net
   - ablation chart
   - case study examples

7. Explainability demo
   - show one user profile
   - show top 3 recommendations
   - show conflict-rejected example

### 8.3 Demo scenarios to showcase

Scenario A:

- user skill: tailoring
- constraint: cannot work after 7 PM
- CARE-Net recommends daytime boutique role
- CARE-Net rejects late evening shop role

Scenario B:

- user skill: bookkeeping
- constraint: remote only due to mobility issues
- CARE-Net promotes remote data-entry roles
- CARE-Net penalizes office-based travel-heavy roles

Scenario C:

- same skill match but two jobs differ only in flexibility
- CARE-Net ranks flexible role higher because of attention over benefits and schedule

## 9. Graph Extension and Future GNN Upgrade

Represent the ecosystem as a heterogeneous graph:

- user nodes
- job nodes
- skill nodes
- constraint nodes
- location nodes

Edges:

- `HAS_SKILL`
- `HAS_CONSTRAINT`
- `REQUIRES_SKILL`
- `LOCATED_IN`
- `SUPPORTS_CONSTRAINT`
- `CONFLICTS_WITH`

Then learn `GraphSignal(u,j)` using GraphSAGE, HAN, or another heterogeneous GNN. This can be fused into CARE-Net during reranking.

In the current repository, a lightweight relational graph encoder is already implemented as a practical GNN-style approximation. This section describes the stronger next-stage heterogeneous GNN variants you can mention as future work.

## 10. Suggested Research Contribution Statement

You can describe the contribution like this:

"We propose CARE-Net, a hybrid recommendation architecture for inclusive job matching that combines skill feasibility filtering, constraint-aware attention, conflict reasoning, and dynamic weight generation over sentence-transformer embeddings. Unlike cosine-similarity recommenders, CARE-Net explicitly models whether a job is both semantically relevant and practically feasible for users with personal constraints."
