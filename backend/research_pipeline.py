from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
for candidate_path in (str(CURRENT_DIR), str(PROJECT_ROOT)):
    if candidate_path not in sys.path:
        sys.path.insert(0, candidate_path)


def project_path(*parts: str) -> str:
    return str(PROJECT_ROOT.joinpath(*parts))

try:
    from dynamic_weight_learning import train_dynamic_weight_model
    from experiment_utils import (
        build_job_vector_index,
        get_db,
        infer_embedding_dim,
        load_json,
        normalize_id,
        retrieve_candidate_job_ids,
    )
    from graph_learning import HeteroGraphBuilder, train_graph_model
    from weak_supervision import WeakSupervisionGenerator
except ImportError:  # pragma: no cover - package import fallback
    from backend.dynamic_weight_learning import train_dynamic_weight_model
    from backend.experiment_utils import (
        build_job_vector_index,
        get_db,
        infer_embedding_dim,
        load_json,
        normalize_id,
        retrieve_candidate_job_ids,
    )
    from backend.graph_learning import HeteroGraphBuilder, train_graph_model
    from backend.weak_supervision import WeakSupervisionGenerator

def train_research_pipeline(
    output_dir: str = project_path("backend", "models"),
    split_path: str | None = None,
    top_candidates: int = 80,
    random_negatives: int = 30,
    seed: int = 42,
    dynamic_epochs: int = 120,
    graph_epochs: int = 180,
    max_train_users: int | None = None,
    max_validation_users: int | None = None,
    prepare_only: bool = False,
) -> Dict[str, Any]:
    collections = get_db()
    js_docs = list(collections["js_embeddings"].find())
    jp_docs = list(collections["jp_embeddings"].find())

    if not js_docs or not jp_docs:
        raise RuntimeError("Need both job seeker and job posting embeddings before training the research pipeline.")

    artifact_dir = Path(output_dir)
    artifact_dir.mkdir(parents=True, exist_ok=True)
    split_file = split_path or str(artifact_dir / "data_splits.json")
    if not os.path.exists(split_file):
        raise RuntimeError(
            f"Split file not found at {split_file}. Run backend/create_experiment_splits.py first."
        )

    split_payload = load_json(split_file)
    train_user_ids = set(split_payload.get("train_user_ids", []))
    validation_user_ids = set(split_payload.get("validation_user_ids", []))

    dim = infer_embedding_dim(js_docs, jp_docs)
    job_index = build_job_vector_index(jp_docs, dim=dim)
    jobs_by_id = {normalize_id(job_doc.get("_id")): job_doc for job_doc in jp_docs}

    weak_supervision = WeakSupervisionGenerator()
    train_user_docs = [doc for doc in js_docs if normalize_id(doc.get("user_id")) in train_user_ids]
    validation_user_docs = [doc for doc in js_docs if normalize_id(doc.get("user_id")) in validation_user_ids]

    if max_train_users is not None:
        train_user_docs = train_user_docs[: max(0, max_train_users)]
    if max_validation_users is not None:
        validation_user_docs = validation_user_docs[: max(0, max_validation_users)]

    pseudo_labels = []
    validation_pseudo_labels = []

    for user_doc in train_user_docs:
        candidate_job_ids = retrieve_candidate_job_ids(
            user_doc=user_doc,
            job_index=job_index,
            top_candidates=top_candidates,
            random_negatives=random_negatives,
            seed=seed,
        )
        candidate_jobs = [jobs_by_id[job_id] for job_id in candidate_job_ids if job_id in jobs_by_id]
        pseudo_labels.extend(weak_supervision.label_candidate_set(user_doc, candidate_jobs))

    for user_doc in validation_user_docs:
        candidate_job_ids = retrieve_candidate_job_ids(
            user_doc=user_doc,
            job_index=job_index,
            top_candidates=top_candidates,
            random_negatives=random_negatives,
            seed=seed,
        )
        candidate_jobs = [jobs_by_id[job_id] for job_id in candidate_job_ids if job_id in jobs_by_id]
        validation_pseudo_labels.extend(weak_supervision.label_candidate_set(user_doc, candidate_jobs))

    user_docs_by_id = {str(doc.get("user_id", "")): doc for doc in js_docs}
    dynamic_samples = weak_supervision.to_dynamic_weight_samples(pseudo_labels, user_docs_by_id)

    dynamic_weight_path = artifact_dir / "dynamic_weight_model.pt"
    graph_model_path = artifact_dir / "graph_signal_model.pt"
    pseudo_label_path = artifact_dir / "pseudo_labels.json"
    validation_pseudo_label_path = artifact_dir / "validation_pseudo_labels.json"

    with pseudo_label_path.open("w", encoding="utf-8") as file_handle:
        json.dump(
            [
                {
                    "user_id": record.user_id,
                    "job_id": record.job_id,
                    "posting_id": record.posting_id,
                    "label": record.label,
                    "sample_type": record.sample_type,
                    "sample_weight": record.sample_weight,
                    "job_score": record.pair_result.get("job_score", 0.0),
                    "skill_score": record.pair_result.get("skill_score", 0.0),
                    "constraint_score": record.pair_result.get("constraint_score", 0.0),
                    "conflict_penalty": record.pair_result.get("conflict_penalty", 0.0),
                }
                for record in pseudo_labels
            ],
            file_handle,
            indent=2,
        )

    with validation_pseudo_label_path.open("w", encoding="utf-8") as file_handle:
        json.dump(
            [
                {
                    "user_id": record.user_id,
                    "job_id": record.job_id,
                    "posting_id": record.posting_id,
                    "label": record.label,
                    "sample_type": record.sample_type,
                    "sample_weight": record.sample_weight,
                    "job_score": record.pair_result.get("job_score", 0.0),
                    "skill_score": record.pair_result.get("skill_score", 0.0),
                    "constraint_score": record.pair_result.get("constraint_score", 0.0),
                    "conflict_penalty": record.pair_result.get("conflict_penalty", 0.0),
                }
                for record in validation_pseudo_labels
            ],
            file_handle,
            indent=2,
        )

    dynamic_artifact: Dict[str, Any] = {}
    graph_artifact: Dict[str, Any] = {}

    if not prepare_only:
        try:
            dynamic_artifact = train_dynamic_weight_model(
                dynamic_samples,
                str(dynamic_weight_path),
                epochs=dynamic_epochs,
            )

            graph_builder = HeteroGraphBuilder()
            graph_data = graph_builder.build(js_docs, jp_docs, pseudo_labels)
            graph_artifact = train_graph_model(
                graph_data,
                str(graph_model_path),
                epochs=graph_epochs,
            )
        except RuntimeError as exc:
            raise RuntimeError(
                f"{exc} Run this command again with --prepare-only to generate pseudo labels and verify the pipeline "
                "before installing training dependencies."
            ) from exc

    summary = {
        "trained_at": datetime.now().isoformat(),
        "num_users": len(js_docs),
        "num_jobs": len(jp_docs),
        "train_users": len(train_user_docs),
        "validation_users": len(validation_user_docs),
        "prepare_only": prepare_only,
        "num_pseudo_labels": len(pseudo_labels),
        "num_validation_pseudo_labels": len(validation_pseudo_labels),
        "num_dynamic_samples": len(dynamic_samples),
        "dynamic_weight_model": str(dynamic_weight_path) if dynamic_artifact else None,
        "graph_model": str(graph_model_path) if graph_artifact else None,
        "pseudo_labels": str(pseudo_label_path),
        "validation_pseudo_labels": str(validation_pseudo_label_path),
        "split_file": str(split_file),
        "candidate_sampling": {
            "top_candidates": top_candidates,
            "random_negatives": random_negatives,
            "seed": seed,
        },
        "subset_limits": {
            "max_train_users": max_train_users,
            "max_validation_users": max_validation_users,
        },
        "training_epochs": {
            "dynamic_weight": dynamic_epochs,
            "graph": graph_epochs,
        },
        "dynamic_training_accuracy": dynamic_artifact.get("training_accuracy", None),
        "graph_training_accuracy": graph_artifact.get("training_accuracy", None),
    }

    summary_path = artifact_dir / "research_training_summary.json"
    with summary_path.open("w", encoding="utf-8") as file_handle:
        json.dump(summary, file_handle, indent=2)

    print(json.dumps(summary, indent=2))
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train weakly supervised CARE-Net research artifacts.")
    parser.add_argument("--output-dir", default=project_path("backend", "models"))
    parser.add_argument("--split-path", default=None)
    parser.add_argument("--top-candidates", type=int, default=80)
    parser.add_argument("--random-negatives", type=int, default=30)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--dynamic-epochs", type=int, default=120)
    parser.add_argument("--graph-epochs", type=int, default=180)
    parser.add_argument("--max-train-users", type=int, default=None)
    parser.add_argument("--max-validation-users", type=int, default=None)
    parser.add_argument("--prepare-only", action="store_true")
    args = parser.parse_args()

    train_research_pipeline(
        output_dir=args.output_dir,
        split_path=args.split_path,
        top_candidates=args.top_candidates,
        random_negatives=args.random_negatives,
        seed=args.seed,
        dynamic_epochs=args.dynamic_epochs,
        graph_epochs=args.graph_epochs,
        max_train_users=args.max_train_users,
        max_validation_users=args.max_validation_users,
        prepare_only=args.prepare_only,
    )
