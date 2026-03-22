from __future__ import annotations

import argparse
import os
import sys
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
    from create_experiment_splits import generate_splits
    from evaluate_care_net import evaluate_rankings
    from research_pipeline import train_research_pipeline
except ImportError:  # pragma: no cover - package import fallback
    from backend.create_experiment_splits import generate_splits
    from backend.evaluate_care_net import evaluate_rankings
    from backend.research_pipeline import train_research_pipeline


def torch_is_available() -> bool:
    try:
        import torch  # noqa: F401

        return True
    except Exception:
        return False


def ensure_split_file(split_path: str, seed: int = 42) -> None:
    if os.path.exists(split_path):
        return
    generate_splits(output_path=split_path, seed=seed)


def run_safe_experiment(
    mode: str = "quick",
    split_path: str = project_path("backend", "models", "data_splits.json"),
    labels_path: str | None = None,
    seed: int = 42,
) -> Dict[str, Any]:
    ensure_split_file(split_path=split_path, seed=seed)
    has_torch = torch_is_available()

    if mode == "prepare":
        output_dir = project_path("backend", "models", "prepare_only")
        return train_research_pipeline(
            output_dir=output_dir,
            split_path=split_path,
            top_candidates=40,
            random_negatives=15,
            seed=seed,
            max_train_users=40,
            max_validation_users=10,
            prepare_only=True,
        )

    if mode == "quick":
        output_dir = project_path("backend", "models", "quick_debug")
        training_summary = train_research_pipeline(
            output_dir=output_dir,
            split_path=split_path,
            top_candidates=40,
            random_negatives=15,
            seed=seed,
            dynamic_epochs=25,
            graph_epochs=30,
            max_train_users=50,
            max_validation_users=15,
            prepare_only=not has_torch,
        )
        evaluation_output = os.path.join(output_dir, "evaluation_test_sample.json")
        evaluation_summary = evaluate_rankings(
            split_name="test",
            split_path=split_path,
            output_path=evaluation_output,
            labels_path=labels_path,
            top_candidates=40,
            random_negatives=15,
            seed=seed,
            max_users=20,
        )
        return {
            "mode": mode,
            "torch_available": has_torch,
            "training_summary": training_summary,
            "evaluation_summary": evaluation_summary,
        }

    if mode == "full":
        output_dir = project_path("backend", "models")
        if not has_torch:
            raise RuntimeError(
                "PyTorch is not installed. Install dependencies first or use --mode quick / --mode prepare."
            )

        training_summary = train_research_pipeline(
            output_dir=output_dir,
            split_path=split_path,
            top_candidates=80,
            random_negatives=30,
            seed=seed,
            dynamic_epochs=120,
            graph_epochs=180,
            prepare_only=False,
        )
        evaluation_output = os.path.join(output_dir, "evaluation", "evaluation_test.json")
        evaluation_summary = evaluate_rankings(
            split_name="test",
            split_path=split_path,
            output_path=evaluation_output,
            labels_path=labels_path,
            top_candidates=80,
            random_negatives=30,
            seed=seed,
            max_users=None,
        )
        return {
            "mode": mode,
            "torch_available": has_torch,
            "training_summary": training_summary,
            "evaluation_summary": evaluation_summary,
        }

    raise ValueError(f"Unsupported mode: {mode}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Safe wrapper for CARE-Net data splitting, subset training, and evaluation."
    )
    parser.add_argument("--mode", default="quick", choices=["prepare", "quick", "full"])
    parser.add_argument("--split-path", default=project_path("backend", "models", "data_splits.json"))
    parser.add_argument("--labels-path", default=None)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    summary = run_safe_experiment(
        mode=arguments.mode,
        split_path=arguments.split_path,
        labels_path=arguments.labels_path,
        seed=arguments.seed,
    )
    print(summary)
