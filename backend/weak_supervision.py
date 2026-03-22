from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence

try:
    from care_net import CARENetRanker
    from dynamic_weight_learning import (
        DynamicWeightSample,
        extract_pair_feature_vector,
        extract_user_context_features,
    )
except ImportError:  # pragma: no cover - package import fallback
    from backend.care_net import CARENetRanker
    from backend.dynamic_weight_learning import (
        DynamicWeightSample,
        extract_pair_feature_vector,
        extract_user_context_features,
    )


@dataclass
class PseudoLabelRecord:
    user_id: str
    job_id: str
    posting_id: str
    label: int
    sample_type: str
    sample_weight: float
    pair_result: Dict[str, Any]


class WeakSupervisionGenerator:
    """
    Generates pseudo labels for CARE-Net training when human labels are unavailable.
    """

    def __init__(self, ranker: Optional[CARENetRanker] = None):
        self.ranker = ranker or CARENetRanker()

    def label_pair(self, user_doc: Dict[str, Any], job_doc: Dict[str, Any]) -> Optional[PseudoLabelRecord]:
        result = self.ranker.score_job(user_doc, job_doc)
        label_config = self._infer_pseudo_label(result)
        if label_config is None:
            return None

        label, sample_type, sample_weight = label_config
        return PseudoLabelRecord(
            user_id=str(user_doc.get("user_id", "")),
            job_id=str(job_doc.get("_id", "")),
            posting_id=str(job_doc.get("posting_id", "")),
            label=label,
            sample_type=sample_type,
            sample_weight=sample_weight,
            pair_result=result,
        )

    def generate_pseudo_labels(
        self,
        user_docs: Sequence[Dict[str, Any]],
        job_docs: Sequence[Dict[str, Any]],
    ) -> List[PseudoLabelRecord]:
        records: List[PseudoLabelRecord] = []
        for user_doc in user_docs:
            records.extend(self.label_candidate_set(user_doc, job_docs))
        return records

    def label_candidate_set(
        self,
        user_doc: Dict[str, Any],
        job_docs: Sequence[Dict[str, Any]],
        top_positive_fraction: float = 0.12,
        max_positives: int = 8,
    ) -> List[PseudoLabelRecord]:
        scored_pairs: List[tuple[Dict[str, Any], Dict[str, Any]]] = []
        for job_doc in job_docs:
            scored_pairs.append((job_doc, self.ranker.score_job(user_doc, job_doc)))

        safe_candidates = [
            (job_doc, result, self._positive_proxy_score(result))
            for job_doc, result in scored_pairs
            if result.get("skill_gate_passed")
            and result.get("skill_score", 0.0) >= 0.45
            and result.get("conflict_penalty", 1.0) <= 0.25
        ]
        safe_candidates.sort(key=lambda item: item[2], reverse=True)

        positive_budget = 0
        if safe_candidates:
            positive_budget = min(
                max_positives,
                max(1, int(round(len(scored_pairs) * top_positive_fraction))),
                len(safe_candidates),
            )

        positive_job_ids = {
            str(job_doc.get("_id", ""))
            for job_doc, _, _ in safe_candidates[:positive_budget]
        }

        records: List[PseudoLabelRecord] = []
        for job_doc, result in scored_pairs:
            job_id = str(job_doc.get("_id", ""))
            if job_id in positive_job_ids:
                proxy_score = self._positive_proxy_score(result)
                sample_weight = 1.0 if proxy_score >= 0.60 else 0.8
                records.append(
                    PseudoLabelRecord(
                        user_id=str(user_doc.get("user_id", "")),
                        job_id=job_id,
                        posting_id=str(job_doc.get("posting_id", "")),
                        label=1,
                        sample_type="relative_positive",
                        sample_weight=sample_weight,
                        pair_result=result,
                    )
                )
                continue

            label_config = self._infer_negative_label(result)
            if label_config is None:
                continue

            label, sample_type, sample_weight = label_config
            records.append(
                PseudoLabelRecord(
                    user_id=str(user_doc.get("user_id", "")),
                    job_id=job_id,
                    posting_id=str(job_doc.get("posting_id", "")),
                    label=label,
                    sample_type=sample_type,
                    sample_weight=sample_weight,
                    pair_result=result,
                )
            )

        return records

    def to_dynamic_weight_samples(
        self,
        records: Iterable[PseudoLabelRecord],
        user_docs_by_id: Dict[str, Dict[str, Any]],
    ) -> List[DynamicWeightSample]:
        samples: List[DynamicWeightSample] = []
        for record in records:
            user_doc = user_docs_by_id.get(record.user_id)
            if not user_doc:
                continue

            context = extract_user_context_features(user_doc)
            pair_features = extract_pair_feature_vector(record.pair_result)
            samples.append(
                DynamicWeightSample(
                    user_context=context,
                    pair_features=pair_features,
                    label=float(record.label),
                    sample_weight=record.sample_weight,
                    user_id=record.user_id,
                    job_id=record.job_id,
                )
            )
        return samples

    def _infer_pseudo_label(self, result: Dict[str, Any]) -> Optional[tuple[int, str, float]]:
        if (
            result.get("skill_gate_passed")
            and result.get("skill_score", 0.0) >= 0.58
            and result.get("conflict_penalty", 1.0) <= 0.15
            and (
                result.get("constraint_score", 0.0) >= 0.18
                or result.get("location_score", 0.0) >= 0.45
            )
        ):
            return 1, "high_confidence_positive", 1.0

        return self._infer_negative_label(result)

    def _infer_negative_label(self, result: Dict[str, Any]) -> Optional[tuple[int, str, float]]:
        if result.get("skill_gate_passed") and result.get("conflict_penalty", 0.0) >= 0.55:
            return 0, "constraint_conflict_negative", 1.0

        if not result.get("skill_gate_passed"):
            return 0, "skill_gate_negative", 0.9

        if result.get("skill_score", 0.0) < 0.30:
            return 0, "weak_skill_negative", 0.8

        if (
            result.get("skill_score", 0.0) < 0.38
            and result.get("constraint_score", 0.0) < 0.18
        ):
            return 0, "weak_match_negative", 0.7

        return None

    def _positive_proxy_score(self, result: Dict[str, Any]) -> float:
        return (
            0.55 * float(result.get("skill_score", 0.0))
            + 0.20 * float(result.get("constraint_score", 0.0))
            + 0.15 * float(result.get("location_score", 0.0))
            + 0.10 * float(result.get("attention_score", 0.0))
            - 0.35 * float(result.get("conflict_penalty", 0.0))
        )
