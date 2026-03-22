from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Sequence

import numpy as np

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
        compute_user_ranking_metrics,
        cosine_similarity,
        get_db,
        infer_embedding_dim,
        load_json,
        load_label_records,
        normalize_id,
        retrieve_candidate_job_ids,
        save_json,
        summarize_ranking_metrics,
        to_unit_vector,
    )
    from weak_supervision import WeakSupervisionGenerator
except ImportError:  # pragma: no cover - package import fallback
    from backend.care_net_service import get_ranker
    from backend.experiment_utils import (
        aggregate_user_baseline_vector,
        build_job_vector_index,
        compute_user_ranking_metrics,
        cosine_similarity,
        get_db,
        infer_embedding_dim,
        load_json,
        load_label_records,
        normalize_id,
        retrieve_candidate_job_ids,
        save_json,
        summarize_ranking_metrics,
        to_unit_vector,
    )
    from backend.weak_supervision import WeakSupervisionGenerator


def build_job_vector_lookup(job_docs: Sequence[Dict[str, Any]], dim: int) -> Dict[str, np.ndarray]:
    index = build_job_vector_index(job_docs, dim=dim)
    return {
        job_id: index["matrix"][row_index]
        for row_index, job_id in enumerate(index["job_ids"])
    }


def evaluate_rankings(
    split_name: str,
    split_path: str,
    output_path: str,
    labels_path: str | None = None,
    top_candidates: int = 100,
    random_negatives: int = 30,
    seed: int = 42,
    max_users: int | None = None,
    k_values: Sequence[int] = (5, 10),
) -> Dict[str, Any]:
    collections = get_db()
    user_docs = list(collections["js_embeddings"].find())
    job_docs = list(collections["jp_embeddings"].find())

    split_payload = load_json(split_path)
    split_key = f"{split_name}_user_ids"
    selected_user_ids = split_payload.get(split_key, [])
    if max_users is not None:
        selected_user_ids = selected_user_ids[:max_users]

    users_by_id = {normalize_id(doc.get("user_id")): doc for doc in user_docs}
    jobs_by_id = {normalize_id(doc.get("_id")): doc for doc in job_docs}

    selected_user_docs = [users_by_id[user_id] for user_id in selected_user_ids if user_id in users_by_id]
    dim = infer_embedding_dim(selected_user_docs, job_docs)
    job_index = build_job_vector_index(job_docs, dim=dim)
    job_vector_lookup = build_job_vector_lookup(job_docs, dim=dim)

    label_map = load_label_records(labels_path) if labels_path else {}
    evaluation_protocol = "manual_gold" if labels_path else "proxy_pseudo_labels"

    ranker = get_ranker()
    proxy_labeler = WeakSupervisionGenerator()

    baseline_records: List[Dict[str, Any]] = []
    care_records: List[Dict[str, Any]] = []
    skipped_users = 0
    user_examples: List[Dict[str, Any]] = []

    for user_doc in selected_user_docs:
        user_id = normalize_id(user_doc.get("user_id"))
        if not user_id:
            skipped_users += 1
            continue

        if labels_path:
            candidate_job_ids = [job_id for job_id in label_map.get(user_id, {}) if job_id in jobs_by_id]
        else:
            candidate_job_ids = retrieve_candidate_job_ids(
                user_doc=user_doc,
                job_index=job_index,
                top_candidates=top_candidates,
                random_negatives=random_negatives,
                seed=seed,
            )

        candidate_jobs = [jobs_by_id[job_id] for job_id in candidate_job_ids if job_id in jobs_by_id]
        if not candidate_jobs:
            skipped_users += 1
            continue

        labels_for_user: Dict[str, Dict[str, Any]] = {}
        if labels_path:
            labels_for_user = {job_id: label_map[user_id][job_id] for job_id in candidate_job_ids if user_id in label_map and job_id in label_map[user_id]}
        else:
            proxy_records = proxy_labeler.label_candidate_set(user_doc, candidate_jobs)
            for record in proxy_records:
                labels_for_user[normalize_id(record.job_id)] = {
                    "relevance": int(record.label),
                    "constraint_violation": bool(record.sample_type == "constraint_conflict_negative"),
                    "source": "pseudo",
                    "sample_type": record.sample_type,
                }

        labeled_candidate_jobs = [job_doc for job_doc in candidate_jobs if normalize_id(job_doc.get("_id")) in labels_for_user]
        if len(labeled_candidate_jobs) < 2:
            skipped_users += 1
            continue

        user_baseline_vector = aggregate_user_baseline_vector(user_doc, dim=dim)
        baseline_ranked_items: List[Dict[str, Any]] = []
        care_ranked_items: List[Dict[str, Any]] = []

        for job_doc in labeled_candidate_jobs:
            job_id = normalize_id(job_doc.get("_id"))
            job_label = labels_for_user[job_id]
            job_vector = job_vector_lookup.get(job_id)
            baseline_score = cosine_similarity(user_baseline_vector, job_vector) if job_vector is not None else 0.0

            care_result = ranker.score_job(user_doc, job_doc)
            care_ranked_items.append(
                {
                    "job_id": job_id,
                    "score": float(care_result.get("job_score", 0.0)),
                    "relevance": int(job_label["relevance"]),
                    "constraint_violation": bool(job_label["constraint_violation"]),
                    "explanation": care_result.get("explanation", ""),
                    "skill_gate_passed": bool(care_result.get("skill_gate_passed", False)),
                    "sample_type": job_label.get("sample_type", ""),
                }
            )
            baseline_ranked_items.append(
                {
                    "job_id": job_id,
                    "score": float(baseline_score),
                    "relevance": int(job_label["relevance"]),
                    "constraint_violation": bool(job_label["constraint_violation"]),
                    "sample_type": job_label.get("sample_type", ""),
                }
            )

        baseline_ranked_items.sort(key=lambda item: item["score"], reverse=True)
        care_ranked_items.sort(key=lambda item: item["score"], reverse=True)

        baseline_user_metrics = compute_user_ranking_metrics(baseline_ranked_items, k_values=k_values)
        care_user_metrics = compute_user_ranking_metrics(care_ranked_items, k_values=k_values)

        baseline_records.append({"user_id": user_id, **baseline_user_metrics})
        care_records.append({"user_id": user_id, **care_user_metrics})

        if len(user_examples) < 10:
            user_examples.append(
                {
                    "user_id": user_id,
                    "baseline_top5": baseline_ranked_items[:5],
                    "care_net_top5": care_ranked_items[:5],
                }
            )

    baseline_summary = summarize_ranking_metrics(baseline_records, k_values=k_values)
    care_summary = summarize_ranking_metrics(care_records, k_values=k_values)

    result_payload = {
        "generated_at": datetime.now().isoformat(),
        "evaluation_protocol": evaluation_protocol,
        "note": (
            "Manual-gold evaluation is the preferred final result. Proxy pseudo-label evaluation is useful for development "
            "and ablation but should be reported as a proxy metric."
        ),
        "config": {
            "split_name": split_name,
            "split_path": split_path,
            "labels_path": labels_path,
            "top_candidates": top_candidates,
            "random_negatives": random_negatives,
            "seed": seed,
            "max_users": max_users,
            "k_values": list(k_values),
        },
        "dataset": {
            "requested_users": len(selected_user_ids),
            "evaluated_users": len(care_records),
            "skipped_users": skipped_users,
            "num_jobs": len(job_docs),
        },
        "baseline_cosine": baseline_summary,
        "care_net": care_summary,
        "sample_rankings": user_examples,
    }

    save_json(result_payload, output_path)
    print(f"Saved evaluation results to {Path(output_path).resolve()}")
    print("Baseline:", baseline_summary)
    print("CARE-Net:", care_summary)
    return result_payload


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate baseline cosine similarity against CARE-Net.")
    parser.add_argument("--split", default="test", choices=["train", "validation", "test"])
    parser.add_argument("--split-path", default=project_path("backend", "models", "data_splits.json"))
    parser.add_argument("--output", default=project_path("backend", "models", "evaluation", "evaluation_test.json"))
    parser.add_argument("--labels-path", default=None, help="Optional manual gold labels JSON file.")
    parser.add_argument("--top-candidates", type=int, default=100)
    parser.add_argument("--random-negatives", type=int, default=30)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--max-users", type=int, default=None)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    evaluate_rankings(
        split_name=args.split,
        split_path=args.split_path,
        output_path=args.output,
        labels_path=args.labels_path,
        top_candidates=args.top_candidates,
        random_negatives=args.random_negatives,
        seed=args.seed,
        max_users=args.max_users,
    )
