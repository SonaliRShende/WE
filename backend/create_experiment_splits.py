from __future__ import annotations

import argparse
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
    from experiment_utils import create_seeker_split_ids, get_db, normalize_id, save_json
except ImportError:  # pragma: no cover - package import fallback
    from backend.experiment_utils import create_seeker_split_ids, get_db, normalize_id, save_json


def generate_splits(
    output_path: str,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
) -> Dict[str, Any]:
    collections = get_db()
    user_docs = list(collections["js_embeddings"].find({}, {"user_id": 1}))
    user_ids = [normalize_id(doc.get("user_id")) for doc in user_docs if normalize_id(doc.get("user_id"))]

    split_payload = create_seeker_split_ids(
        user_ids=user_ids,
        train_ratio=train_ratio,
        val_ratio=val_ratio,
        test_ratio=test_ratio,
        seed=seed,
    )
    split_payload["generated_at"] = datetime.now().isoformat()
    split_payload["source_collection"] = "JS_embeddings"

    save_json(split_payload, output_path)
    print(f"Saved experiment splits to {Path(output_path).resolve()}")
    print(split_payload["counts"])
    return split_payload


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create seeker-level train/validation/test splits for CARE-Net experiments.")
    parser.add_argument("--output", default=project_path("backend", "models", "data_splits.json"))
    parser.add_argument("--train-ratio", type=float, default=0.70)
    parser.add_argument("--val-ratio", type=float, default=0.15)
    parser.add_argument("--test-ratio", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    generate_splits(
        output_path=arguments.output,
        train_ratio=arguments.train_ratio,
        val_ratio=arguments.val_ratio,
        test_ratio=arguments.test_ratio,
        seed=arguments.seed,
    )
