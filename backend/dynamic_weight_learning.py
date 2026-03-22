from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence

import numpy as np

try:
    import torch
    from torch import nn
except Exception:  # pragma: no cover - fallback for environments without torch
    torch = None
    nn = None


REMOTE_KEYWORDS = {"remote", "work from home", "wfh", "home based", "telecommute"}
CARE_KEYWORDS = {"childcare", "caregiver", "school hours", "family care"}
ACCESSIBILITY_KEYWORDS = {"disability", "wheelchair", "mobility", "hearing", "vision", "accessibility"}
TIME_KEYWORDS = {"after", "before", "evening", "night", "morning", "daytime", "weekend"}


def _normalized_text(text: str) -> str:
    return " ".join(str(text).lower().split())


def _contains_any(text: str, keywords: Sequence[str] | set[str]) -> bool:
    text = _normalized_text(text)
    return any(keyword in text for keyword in keywords)


def extract_user_context_features(user_doc: Dict[str, Any], constraint_nodes: Optional[Sequence[Dict[str, Any]]] = None) -> np.ndarray:
    constraints = constraint_nodes if constraint_nodes is not None else user_doc.get("constraints_embeddings", [])
    constraint_text = _normalized_text(" ".join(item.get("constraint_text", item.get("text", "")) for item in constraints))

    skills_count = float(len(user_doc.get("skills_embeddings", [])))
    constraints_count = float(len(user_doc.get("constraints_embeddings", [])))
    has_qualification = 1.0 if user_doc.get("qualification_embedding") else 0.0
    has_location = 1.0 if user_doc.get("location_embedding") else 0.0
    remote_preference = 1.0 if _contains_any(constraint_text, REMOTE_KEYWORDS) else 0.0
    care_need = 1.0 if _contains_any(constraint_text, CARE_KEYWORDS) else 0.0
    accessibility_need = 1.0 if _contains_any(constraint_text, ACCESSIBILITY_KEYWORDS) else 0.0
    schedule_rigidity = 1.0 if _contains_any(constraint_text, TIME_KEYWORDS) else 0.0

    feature_vector = np.array(
        [
            1.0,
            min(skills_count / 10.0, 1.0),
            min(constraints_count / 6.0, 1.0),
            has_qualification,
            has_location,
            remote_preference,
            care_need,
            accessibility_need,
            schedule_rigidity,
        ],
        dtype=np.float32,
    )
    return feature_vector


def extract_pair_feature_vector(pair_result: Dict[str, Any]) -> np.ndarray:
    return np.array(
        [
            float(pair_result.get("skill_score", 0.0)),
            float(pair_result.get("constraint_score", 0.0)),
            float(pair_result.get("location_score", 0.0)),
            float(pair_result.get("attention_score", 0.0)),
            1.0 - float(pair_result.get("conflict_penalty", 0.0)),
        ],
        dtype=np.float32,
    )


def pair_probability_from_weights(weights: np.ndarray, pair_features: np.ndarray) -> float:
    skill_score = float(pair_features[0])
    constraint_score = float(pair_features[1])
    location_score = float(pair_features[2])
    attention_score = float(pair_features[3])
    non_conflict = float(pair_features[4])

    weighted_core = (
        float(weights[0]) * skill_score
        + float(weights[1]) * constraint_score
        + float(weights[2]) * location_score
    )
    raw_score = attention_score * weighted_core * non_conflict
    return float(1.0 / (1.0 + np.exp(-6.0 * (raw_score - 0.45))))


@dataclass
class DynamicWeightSample:
    user_context: np.ndarray
    pair_features: np.ndarray
    label: float
    sample_weight: float
    user_id: str
    job_id: str


if torch is not None:
    class DynamicWeightNet(nn.Module):
        def __init__(self, input_dim: int = 9, hidden_dim: int = 32):
            super().__init__()
            self.network = nn.Sequential(
                nn.Linear(input_dim, hidden_dim),
                nn.ReLU(),
                nn.Linear(hidden_dim, hidden_dim),
                nn.ReLU(),
                nn.Linear(hidden_dim, 3),
            )

        def forward(self, user_context: torch.Tensor) -> torch.Tensor:
            logits = self.network(user_context)
            return torch.softmax(logits, dim=-1)


    def differentiable_pair_probability(weights: torch.Tensor, pair_features: torch.Tensor) -> torch.Tensor:
        skill_score = pair_features[:, 0]
        constraint_score = pair_features[:, 1]
        location_score = pair_features[:, 2]
        attention_score = pair_features[:, 3]
        non_conflict = pair_features[:, 4]

        weighted_core = (
            weights[:, 0] * skill_score
            + weights[:, 1] * constraint_score
            + weights[:, 2] * location_score
        )
        raw_score = attention_score * weighted_core * non_conflict
        return torch.sigmoid(6.0 * (raw_score - 0.45))


def train_dynamic_weight_model(
    samples: Iterable[DynamicWeightSample],
    output_path: str,
    epochs: int = 120,
    learning_rate: float = 1e-3,
) -> Dict[str, Any]:
    if torch is None or nn is None:
        raise RuntimeError("PyTorch is required to train the dynamic weight model.")

    sample_list = list(samples)
    if not sample_list:
        raise ValueError("No samples provided for dynamic weight training.")

    model = DynamicWeightNet(input_dim=len(sample_list[0].user_context))
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    criterion = nn.BCELoss(reduction="none")

    context_tensor = torch.tensor(np.stack([item.user_context for item in sample_list]), dtype=torch.float32)
    pair_tensor = torch.tensor(np.stack([item.pair_features for item in sample_list]), dtype=torch.float32)
    label_tensor = torch.tensor([item.label for item in sample_list], dtype=torch.float32)
    weight_tensor = torch.tensor([item.sample_weight for item in sample_list], dtype=torch.float32)

    model.train()
    for _ in range(epochs):
        optimizer.zero_grad()
        weights = model(context_tensor)
        predictions = differentiable_pair_probability(weights, pair_tensor)
        loss = criterion(predictions, label_tensor)
        loss = (loss * weight_tensor).mean()
        loss.backward()
        optimizer.step()

    model.eval()
    with torch.no_grad():
        learned_weights = model(context_tensor).mean(dim=0).cpu().numpy().tolist()
        predictions = differentiable_pair_probability(model(context_tensor), pair_tensor)
        binary_predictions = (predictions >= 0.5).float()
        accuracy = float((binary_predictions == label_tensor).float().mean().item())

    artifact = {
        "model_state_dict": model.state_dict(),
        "input_dim": len(sample_list[0].user_context),
        "feature_names": [
            "bias",
            "skills_density",
            "constraint_density",
            "has_qualification",
            "has_location",
            "remote_preference",
            "care_need",
            "accessibility_need",
            "schedule_rigidity",
        ],
        "mean_weights": learned_weights,
        "training_accuracy": accuracy,
    }
    torch.save(artifact, output_path)
    return artifact


class DynamicWeightPredictor:
    def __init__(self, model: Any):
        self.model = model

    @classmethod
    def load(cls, artifact_path: str) -> "DynamicWeightPredictor":
        if torch is None:
            raise RuntimeError("PyTorch is required to load the dynamic weight model.")

        artifact = torch.load(artifact_path, map_location="cpu")
        model = DynamicWeightNet(input_dim=artifact.get("input_dim", 9))
        model.load_state_dict(artifact["model_state_dict"])
        model.eval()
        return cls(model)

    def predict(self, user_doc: Dict[str, Any], constraint_nodes: Optional[Sequence[Dict[str, Any]]] = None) -> Dict[str, float]:
        if torch is None:
            raise RuntimeError("PyTorch is required to run the dynamic weight model.")

        context = extract_user_context_features(user_doc, constraint_nodes)
        context_tensor = torch.tensor(context, dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            weights = self.model(context_tensor).squeeze(0).cpu().numpy()

        return {
            "w_skill": float(weights[0]),
            "w_constraint": float(weights[1]),
            "w_location": float(weights[2]),
        }
