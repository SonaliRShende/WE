from __future__ import annotations

import json
import os
import random
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional during bootstrap
    def load_dotenv(*args: Any, **kwargs: Any) -> bool:
        return False

load_dotenv()


def get_db() -> Dict[str, Any]:
    try:
        from pymongo.mongo_client import MongoClient
        from pymongo.server_api import ServerApi
    except ImportError as exc:  # pragma: no cover - dependency guard
        raise RuntimeError("pymongo is required to access MongoDB. Install backend requirements first.") from exc

    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise RuntimeError("ERROR: MONGO_URI not found in .env file.")

    client = MongoClient(mongo_uri, server_api=ServerApi("1"))
    client.admin.command("ping")
    database = client["skill_constraint_db"]
    return {
        "client": client,
        "db": database,
        "js_embeddings": database["JS_embeddings"],
        "jp_embeddings": database["JP_embeddings"],
    }


def normalize_id(value: Any) -> str:
    return str(value) if value is not None else ""


def to_unit_vector(embedding: Any) -> Optional[np.ndarray]:
    if embedding is None:
        return None
    try:
        vector = np.asarray(embedding, dtype=np.float32).reshape(-1)
    except Exception:
        return None
    if vector.size == 0:
        return None
    norm = float(np.linalg.norm(vector))
    if norm == 0.0:
        return None
    return vector / norm


def mean_embedding(vectors: Sequence[np.ndarray], dim: int = 384) -> np.ndarray:
    if not vectors:
        return np.zeros(dim, dtype=np.float32)
    return np.mean(np.stack(vectors), axis=0).astype(np.float32)


def infer_embedding_dim(user_docs: Sequence[Dict[str, Any]], job_docs: Sequence[Dict[str, Any]]) -> int:
    for collection in (user_docs, job_docs):
        for doc in collection:
            for field in [
                "skills_embeddings",
                "constraints_embeddings",
                "job_requirements_embeddings",
                "qualifications_embeddings",
                "benefits_embeddings",
            ]:
                for item in doc.get(field, []):
                    vector = to_unit_vector(item.get("embedding"))
                    if vector is not None:
                        return int(vector.shape[0])
            for field in [
                "qualification_embedding",
                "location_embedding",
                "jobTitle_embedding",
                "jobCategory_embedding",
                "experienceRequired_embedding",
                "jobLocation_embedding",
                "jobType_embedding",
            ]:
                payload = doc.get(field)
                if isinstance(payload, dict):
                    vector = to_unit_vector(payload.get("embedding"))
                    if vector is not None:
                        return int(vector.shape[0])
    return 384


def aggregate_user_baseline_vector(user_doc: Dict[str, Any], dim: int = 384) -> np.ndarray:
    vectors: List[np.ndarray] = []
    for item in user_doc.get("skills_embeddings", []):
        vector = to_unit_vector(item.get("embedding"))
        if vector is not None:
            vectors.append(vector)

    qualification = user_doc.get("qualification_embedding")
    if isinstance(qualification, dict):
        vector = to_unit_vector(qualification.get("embedding"))
        if vector is not None:
            vectors.append(vector)

    return mean_embedding(vectors, dim=dim)


def aggregate_job_baseline_vector(job_doc: Dict[str, Any], dim: int = 384) -> np.ndarray:
    vectors: List[np.ndarray] = []

    for field in ["jobTitle_embedding", "jobCategory_embedding"]:
        payload = job_doc.get(field)
        if isinstance(payload, dict):
            vector = to_unit_vector(payload.get("embedding"))
            if vector is not None:
                vectors.append(vector)

    for item in job_doc.get("job_requirements_embeddings", []):
        vector = to_unit_vector(item.get("embedding"))
        if vector is not None:
            vectors.append(vector)

    for item in job_doc.get("qualifications_embeddings", []):
        vector = to_unit_vector(item.get("embedding"))
        if vector is not None:
            vectors.append(vector)

    return mean_embedding(vectors, dim=dim)


def cosine_similarity(vector_a: np.ndarray, vector_b: np.ndarray) -> float:
    if vector_a.size == 0 or vector_b.size == 0:
        return 0.0
    return float(np.clip(np.dot(vector_a, vector_b), 0.0, 1.0))


def build_job_vector_index(job_docs: Sequence[Dict[str, Any]], dim: int = 384) -> Dict[str, Any]:
    job_ids: List[str] = []
    posting_ids: List[str] = []
    vectors: List[np.ndarray] = []

    for job_doc in job_docs:
        job_id = normalize_id(job_doc.get("_id"))
        if not job_id:
            continue
        job_ids.append(job_id)
        posting_ids.append(normalize_id(job_doc.get("posting_id")))
        vectors.append(aggregate_job_baseline_vector(job_doc, dim=dim))

    if vectors:
        matrix = np.stack(vectors).astype(np.float32)
    else:
        matrix = np.zeros((0, dim), dtype=np.float32)

    return {
        "job_ids": job_ids,
        "posting_ids": posting_ids,
        "matrix": matrix,
    }


def retrieve_candidate_job_ids(
    user_doc: Dict[str, Any],
    job_index: Dict[str, Any],
    top_candidates: int = 100,
    random_negatives: int = 30,
    seed: int = 42,
) -> List[str]:
    job_ids: List[str] = job_index["job_ids"]
    matrix: np.ndarray = job_index["matrix"]
    if not job_ids or matrix.shape[0] == 0:
        return []

    user_vector = aggregate_user_baseline_vector(user_doc, dim=matrix.shape[1])
    scores = np.matmul(matrix, user_vector)
    ranked_indices = np.argsort(-scores)
    top_indices = ranked_indices[: min(top_candidates, len(job_ids))]

    selected_job_ids = [job_ids[index] for index in top_indices]
    remaining_job_ids = [job_ids[index] for index in ranked_indices[min(top_candidates, len(job_ids)) :]]

    local_seed = seed + sum(ord(char) for char in normalize_id(user_doc.get("user_id")))
    random_generator = random.Random(local_seed)
    if random_negatives > 0 and remaining_job_ids:
        sample_size = min(random_negatives, len(remaining_job_ids))
        selected_job_ids.extend(random_generator.sample(remaining_job_ids, sample_size))

    return list(dict.fromkeys(selected_job_ids))


def create_seeker_split_ids(
    user_ids: Sequence[str],
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
) -> Dict[str, Any]:
    if not np.isclose(train_ratio + val_ratio + test_ratio, 1.0):
        raise ValueError("Train, validation, and test ratios must sum to 1.0")

    unique_ids = sorted({normalize_id(user_id) for user_id in user_ids if normalize_id(user_id)})
    random_generator = random.Random(seed)
    shuffled_ids = unique_ids[:]
    random_generator.shuffle(shuffled_ids)

    total = len(shuffled_ids)
    train_end = int(total * train_ratio)
    val_end = train_end + int(total * val_ratio)

    split_payload = {
        "seed": seed,
        "counts": {
            "total_seekers": total,
            "train": train_end,
            "validation": val_end - train_end,
            "test": total - val_end,
        },
        "train_user_ids": shuffled_ids[:train_end],
        "validation_user_ids": shuffled_ids[train_end:val_end],
        "test_user_ids": shuffled_ids[val_end:],
    }
    return split_payload


def save_json(payload: Any, output_path: str) -> None:
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with output_file.open("w", encoding="utf-8") as file_handle:
        json.dump(payload, file_handle, indent=2)


def load_json(input_path: str) -> Any:
    with Path(input_path).open("r", encoding="utf-8") as file_handle:
        return json.load(file_handle)


def load_label_records(labels_path: str) -> Dict[str, Dict[str, Dict[str, Any]]]:
    raw_payload = load_json(labels_path)
    label_map: Dict[str, Dict[str, Dict[str, Any]]] = {}

    if isinstance(raw_payload, dict):
        if "labels" in raw_payload:
            raw_records = raw_payload["labels"]
        elif "records" in raw_payload:
            raw_records = raw_payload["records"]
        else:
            raw_records = []
    else:
        raw_records = raw_payload

    for record in raw_records:
        if not isinstance(record, dict):
            continue
        user_id = normalize_id(record.get("user_id"))
        job_id = normalize_id(record.get("job_id"))
        if not user_id or not job_id:
            continue
        label_map.setdefault(user_id, {})[job_id] = {
            "relevance": int(record.get("relevance", record.get("label", 0))),
            "constraint_violation": bool(record.get("constraint_violation", False)),
            "source": record.get("source", "manual"),
            "sample_type": record.get("sample_type", ""),
        }

    return label_map


def dcg_at_k(relevances: Sequence[float], k: int) -> float:
    total = 0.0
    for index, relevance in enumerate(relevances[:k]):
        total += (2 ** float(relevance) - 1.0) / np.log2(index + 2.0)
    return float(total)


def ndcg_at_k(relevances: Sequence[float], k: int) -> float:
    ideal = sorted(relevances, reverse=True)
    ideal_dcg = dcg_at_k(ideal, k)
    if ideal_dcg == 0.0:
        return 0.0
    return dcg_at_k(relevances, k) / ideal_dcg


def average_precision_at_k(binary_relevances: Sequence[int], total_positives: int, k: int) -> float:
    if total_positives == 0:
        return 0.0

    hit_count = 0
    precision_sum = 0.0
    for index, relevance in enumerate(binary_relevances[:k], start=1):
        if relevance > 0:
            hit_count += 1
            precision_sum += hit_count / index
    return precision_sum / total_positives


def reciprocal_rank(binary_relevances: Sequence[int]) -> float:
    for index, relevance in enumerate(binary_relevances, start=1):
        if relevance > 0:
            return 1.0 / index
    return 0.0


def summarize_ranking_metrics(
    per_user_records: Sequence[Dict[str, Any]],
    k_values: Sequence[int] = (5, 10),
) -> Dict[str, Any]:
    if not per_user_records:
        return {"num_users": 0, "k_metrics": {}}

    summary: Dict[str, Any] = {
        "num_users": len(per_user_records),
        "users_with_relevant_items": int(sum(record["total_positives"] > 0 for record in per_user_records)),
        "candidate_coverage": float(np.mean([record["candidate_count"] for record in per_user_records])),
        "k_metrics": {},
        "mrr": float(np.mean([record["mrr"] for record in per_user_records])),
    }

    for k in k_values:
        precision_values = [record["metrics"][f"precision@{k}"] for record in per_user_records]
        recall_values = [record["metrics"][f"recall@{k}"] for record in per_user_records]
        ndcg_values = [record["metrics"][f"ndcg@{k}"] for record in per_user_records]
        map_values = [record["metrics"][f"map@{k}"] for record in per_user_records]
        violation_values = [record["metrics"][f"violation_rate@{k}"] for record in per_user_records]

        summary["k_metrics"][str(k)] = {
            "precision": float(np.mean(precision_values)),
            "recall": float(np.mean(recall_values)),
            "ndcg": float(np.mean(ndcg_values)),
            "map": float(np.mean(map_values)),
            "violation_rate": float(np.mean(violation_values)),
        }

    return summary


def compute_user_ranking_metrics(
    ranked_items: Sequence[Dict[str, Any]],
    k_values: Sequence[int] = (5, 10),
) -> Dict[str, Any]:
    relevances = [float(item["relevance"]) for item in ranked_items]
    binary_relevances = [1 if item["relevance"] > 0 else 0 for item in ranked_items]
    violations = [1 if item.get("constraint_violation") else 0 for item in ranked_items]
    total_positives = sum(binary_relevances)

    metrics: Dict[str, float] = {}
    for k in k_values:
        top_binary = binary_relevances[:k]
        top_violations = violations[:k]
        hits = sum(top_binary)
        metrics[f"precision@{k}"] = hits / max(k, 1)
        metrics[f"recall@{k}"] = hits / max(total_positives, 1)
        metrics[f"ndcg@{k}"] = ndcg_at_k(relevances, k)
        metrics[f"map@{k}"] = average_precision_at_k(binary_relevances, total_positives, k)
        metrics[f"violation_rate@{k}"] = sum(top_violations) / max(k, 1)

    return {
        "metrics": metrics,
        "total_positives": total_positives,
        "candidate_count": len(ranked_items),
        "mrr": reciprocal_rank(binary_relevances),
    }
