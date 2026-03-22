from __future__ import annotations

import argparse
import os
import random
import sys
from pathlib import Path
from typing import Any, Dict, List

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
for candidate_path in (str(CURRENT_DIR), str(PROJECT_ROOT)):
    if candidate_path not in sys.path:
        sys.path.insert(0, candidate_path)


def project_path(*parts: str) -> str:
    return str(PROJECT_ROOT.joinpath(*parts))

try:
    from care_net_service import get_ranker
    from experiment_utils import (
        aggregate_user_baseline_vector,
        build_job_vector_index,
        cosine_similarity,
        get_db,
        infer_embedding_dim,
        load_json,
        normalize_id,
        retrieve_candidate_job_ids,
        save_json,
    )
except ImportError:  # pragma: no cover - package import fallback
    from backend.care_net_service import get_ranker
    from backend.experiment_utils import (
        aggregate_user_baseline_vector,
        build_job_vector_index,
        cosine_similarity,
        get_db,
        infer_embedding_dim,
        load_json,
        normalize_id,
        retrieve_candidate_job_ids,
        save_json,
    )


def short_user_summary(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "name": user_doc.get("name", ""),
        "skills": [item.get("skill_name", "") for item in user_doc.get("skills_embeddings", [])[:5]],
        "constraints": [item.get("constraint_text", "") for item in user_doc.get("constraints_embeddings", [])[:5]],
        "qualification": (user_doc.get("qualification_embedding") or {}).get("qualification", ""),
        "location": (user_doc.get("location_embedding") or {}).get("location", ""),
    }


def short_job_summary(job_doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "job_title": job_doc.get("jobTitle", ""),
        "company": job_doc.get("company", ""),
        "requirements": [item.get("requirement", "") for item in job_doc.get("job_requirements_embeddings", [])[:5]],
        "benefits": [item.get("benefit", "") for item in job_doc.get("benefits_embeddings", [])[:5]],
        "location": (job_doc.get("jobLocation_embedding") or {}).get("jobLocation", ""),
        "job_type": (job_doc.get("jobType_embedding") or {}).get("jobType", ""),
    }


def generate_manual_gold_template(
    split_name: str,
    split_path: str,
    output_path: str,
    sample_users: int = 100,
    candidate_pool: int = 80,
    top_per_model: int = 5,
    random_extra: int = 2,
    seed: int = 42,
) -> Dict[str, Any]:
    collections = get_db()
    user_docs = list(collections["js_embeddings"].find())
    job_docs = list(collections["jp_embeddings"].find())

    split_payload = load_json(split_path)
    split_key = f"{split_name}_user_ids"
    user_ids = split_payload.get(split_key, [])[:sample_users]

    users_by_id = {normalize_id(doc.get("user_id")): doc for doc in user_docs}
    jobs_by_id = {normalize_id(doc.get("_id")): doc for doc in job_docs}
    selected_user_docs = [users_by_id[user_id] for user_id in user_ids if user_id in users_by_id]

    dim = infer_embedding_dim(selected_user_docs, job_docs)
    job_index = build_job_vector_index(job_docs, dim=dim)
    job_vectors = {
        job_id: job_index["matrix"][index]
        for index, job_id in enumerate(job_index["job_ids"])
    }

    ranker = get_ranker()
    random_generator = random.Random(seed)
    annotation_records: List[Dict[str, Any]] = []

    for user_doc in selected_user_docs:
        user_id = normalize_id(user_doc.get("user_id"))
        candidate_job_ids = retrieve_candidate_job_ids(
            user_doc=user_doc,
            job_index=job_index,
            top_candidates=candidate_pool,
            random_negatives=random_extra * 3,
            seed=seed,
        )
        candidate_jobs = [jobs_by_id[job_id] for job_id in candidate_job_ids if job_id in jobs_by_id]
        if not candidate_jobs:
            continue

        user_vector = aggregate_user_baseline_vector(user_doc, dim=dim)
        baseline_scored = []
        care_scored = []
        for job_doc in candidate_jobs:
            job_id = normalize_id(job_doc.get("_id"))
            baseline_scored.append(
                {
                    "job_id": job_id,
                    "score": cosine_similarity(user_vector, job_vectors[job_id]),
                }
            )
            care_result = ranker.score_job(user_doc, job_doc)
            care_scored.append(
                {
                    "job_id": job_id,
                    "score": float(care_result.get("job_score", 0.0)),
                    "explanation": care_result.get("explanation", ""),
                }
            )

        baseline_scored.sort(key=lambda item: item["score"], reverse=True)
        care_scored.sort(key=lambda item: item["score"], reverse=True)

        selected_job_ids = [item["job_id"] for item in baseline_scored[:top_per_model]]
        selected_job_ids.extend(item["job_id"] for item in care_scored[:top_per_model])
        remaining = [job_id for job_id in candidate_job_ids if job_id not in selected_job_ids]
        if remaining and random_extra > 0:
            selected_job_ids.extend(random_generator.sample(remaining, min(random_extra, len(remaining))))
        selected_job_ids = list(dict.fromkeys(selected_job_ids))

        baseline_lookup = {item["job_id"]: item["score"] for item in baseline_scored}
        care_lookup = {item["job_id"]: item for item in care_scored}

        for job_id in selected_job_ids:
            job_doc = jobs_by_id[job_id]
            annotation_records.append(
                {
                    "user_id": user_id,
                    "job_id": job_id,
                    "source": "manual_annotation_template",
                    "user_summary": short_user_summary(user_doc),
                    "job_summary": short_job_summary(job_doc),
                    "baseline_score": round(float(baseline_lookup.get(job_id, 0.0)), 4),
                    "care_net_score": round(float(care_lookup.get(job_id, {}).get("score", 0.0)), 4),
                    "care_net_explanation": care_lookup.get(job_id, {}).get("explanation", ""),
                    "relevance": None,
                    "constraint_violation": None,
                    "notes": "",
                }
            )

    payload = {
        "split": split_name,
        "split_path": split_path,
        "sample_users": len(selected_user_docs),
        "records": annotation_records,
        "annotation_instructions": {
            "relevance": {
                "0": "Not suitable. Use this when the skill fit is weak, the role is unrealistic for the user, or a hard constraint makes the job unsuitable.",
                "1": "Relevant but not ideal. Use this when the job is acceptable overall but has weaker alignment on one or more dimensions.",
                "2": "Highly relevant. Use this when skills, role fit, and practical constraints are all strongly aligned.",
            },
            "constraint_violation": {
                "true": "The job clearly breaks a hard user constraint such as time restriction, relocation limit, disability accommodation need, childcare schedule, safety requirement, or remote requirement.",
                "false": "No clear hard-constraint violation is visible from the available information.",
            },
            "recommended_decision_rule": "If a hard constraint is clearly violated, prefer relevance = 0 and constraint_violation = true.",
            "soft_vs_hard_constraints": {
                "hard": "Non-negotiable needs such as cannot work nights, cannot relocate, remote-only requirement, accessibility need, or safety support requirement.",
                "soft": "Preferences such as better salary, preferred city, or nicer company benefits. Soft misses can still receive relevance = 1.",
            },
            "notes": "Use the notes field to briefly mention why you marked a job as unsuitable, moderately suitable, or highly suitable.",
        },
    }
    save_json(payload, output_path)
    print(f"Saved manual gold template to {Path(output_path).resolve()}")
    print(f"Records: {len(annotation_records)}")
    return payload


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a manual gold-label annotation template for CARE-Net evaluation.")
    parser.add_argument("--split", default="test", choices=["train", "validation", "test"])
    parser.add_argument("--split-path", default=project_path("backend", "models", "data_splits.json"))
    parser.add_argument("--output", default=project_path("backend", "models", "manual_gold_annotation_template.json"))
    parser.add_argument("--sample-users", type=int, default=100)
    parser.add_argument("--candidate-pool", type=int, default=80)
    parser.add_argument("--top-per-model", type=int, default=5)
    parser.add_argument("--random-extra", type=int, default=2)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    generate_manual_gold_template(
        split_name=args.split,
        split_path=args.split_path,
        output_path=args.output,
        sample_users=args.sample_users,
        candidate_pool=args.candidate_pool,
        top_per_model=args.top_per_model,
        random_extra=args.random_extra,
        seed=args.seed,
    )
