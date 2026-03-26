from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence, Tuple

import numpy as np


TIME_PATTERN = re.compile(r"(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)", re.IGNORECASE)
SHIFT_RANGE_PATTERN = re.compile(
    r"(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?))\s*(?:-|to|and|until|through)\s*(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?))",
    re.IGNORECASE,
)

REMOTE_KEYWORDS = {
    "remote",
    "work from home",
    "wfh",
    "home based",
    "telecommute",
    "virtual",
}
ONSITE_KEYWORDS = {
    "on-site",
    "onsite",
    "in-person",
    "office",
    "work from office",
    "at office",
}
WEEKEND_KEYWORDS = {
    "weekend",
    "saturday",
    "sunday",
}
EVENING_KEYWORDS = {
    "night",
    "evening",
    "late",
    "overnight",
    "rotating shift",
    "night shift",
    "evening shift",
    "late shift",
}
DAYTIME_KEYWORDS = {
    "daytime",
    "day shift",
    "morning",
    "afternoon",
    "flexible hours",
}
CARE_KEYWORDS = {
    "childcare",
    "caregiver",
    "care giving",
    "family care",
    "school hours",
}
ACCESSIBILITY_KEYWORDS = {
    "disability",
    "wheelchair",
    "mobility",
    "hearing",
    "vision",
    "visual",
    "physical limitation",
    "accessibility",
}
PHYSICAL_DEMAND_KEYWORDS = {
    "lifting",
    "lift",
    "standing",
    "walk long",
    "warehouse",
    "field work",
    "manual labor",
    "carry heavy",
}
TRAVEL_KEYWORDS = {
    "travel",
    "relocate",
    "relocation",
    "field visits",
    "site visits",
}


@dataclass
class CARENetConfig:
    skill_gate_threshold: float = 0.35
    skill_gate_coverage_threshold: float = 0.30
    attention_temperature: float = 0.35
    sigmoid_scale: float = 5.0
    sigmoid_bias: float = 0.40
    top_k_evidence: int = 3
    max_conflict_penalty: float = 0.85


class CARENetRanker:
    """
    Constraint-Aware Reasoning and Embedding Network (CARE-Net).

    This class implements a practical research prototype on top of stored
    sentence-transformer embeddings. The design keeps the current repository
    usable for inference while exposing clear hooks for future supervised
    training and graph augmentation.
    """

    def __init__(
        self,
        config: Optional[CARENetConfig] = None,
        weight_predictor: Optional[Any] = None,
        graph_signal_provider: Optional[Any] = None,
    ):
        self.config = config or CARENetConfig()
        self.weight_predictor = weight_predictor
        self.graph_signal_provider = graph_signal_provider

    def rank_jobs(self, user_doc: Dict[str, Any], job_docs: Sequence[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
        ranked: List[Dict[str, Any]] = []
        rejected_by_skill_gate = 0
        low_skill_confidence = 0
        user_skill_nodes = self._extract_user_skill_nodes(user_doc)
        constraint_nodes = self._extract_constraint_nodes(user_doc)

        prune_threshold = max(0.0, self.config.skill_gate_threshold - 0.20)
        max_pruned = max(10, int(len(job_docs) * 0.40))
        pruned_count = 0

        for job_doc in job_docs:
            if pruned_count < max_pruned and user_skill_nodes and self._should_prune_job(user_skill_nodes, job_doc, prune_threshold):
                pruned_count += 1
                continue

            result = self.score_job(
                user_doc,
                job_doc,
                user_skill_nodes=user_skill_nodes,
                constraint_nodes=constraint_nodes,
            )
            if result["skill_gate_passed"]:
                ranked.append(result)
            else:
                rejected_by_skill_gate += 1
                low_skill_confidence += 1

        ranked.sort(key=lambda item: item["job_score"], reverse=True)
        return ranked, {"rejected_by_skill_gate": rejected_by_skill_gate, "low_skill_confidence": low_skill_confidence}

    def score_job(
        self,
        user_doc: Dict[str, Any],
        job_doc: Dict[str, Any],
        user_skill_nodes: Optional[Sequence[Dict[str, Any]]] = None,
        constraint_nodes: Optional[Sequence[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        user_skill_nodes = list(user_skill_nodes) if user_skill_nodes is not None else self._extract_user_skill_nodes(user_doc)
        constraint_nodes = list(constraint_nodes) if constraint_nodes is not None else self._extract_constraint_nodes(user_doc)
        job_skill_nodes = self._extract_job_skill_nodes(job_doc)
        job_constraint_nodes = self._extract_job_constraint_nodes(job_doc)

        skill_score, skill_coverage, skill_links = self._compute_skill_match(user_skill_nodes, job_skill_nodes)
        skill_gate_score = (0.75 * skill_score) + (0.25 * skill_coverage)

        skill_gate_passed = bool(skill_score > self.config.skill_gate_threshold)

        attention_score, attention_focus, constraint_score = self._compute_constraint_attention(
            constraint_nodes, job_constraint_nodes
        )


        location_score = self._compute_location_score(user_doc, job_doc, constraint_nodes)
        user_location = str(user_doc.get("location_embedding", {}).get("location", "")).lower()
        job_location = str(job_doc.get("jobLocation_embedding", {}).get("jobLocation", "")).lower()
        constraint_text_all = " ".join([c["text"].lower() for c in constraint_nodes])
        
        if any(word in constraint_text_all for word in ['close to home','near home' , 'within commuting distance','neary by','near me']):
            if user_location and job_location and user_location not in job_location:
                conflict_penalty += 0.6
                conflict_reasons.append("Job is not near user's preferred location.")                           
        dynamic_weights = self._generate_dynamic_weights(user_doc, constraint_nodes)
        conflict_penalty, conflict_reasons = self._detect_conflicts(constraint_nodes, job_doc, job_constraint_nodes)
        conflict_penalty = min(conflict_penalty, 0.85)
        underutil_penalty = self._detect_underutilization(user_skill_nodes, job_skill_nodes)

        if underutil_penalty > 0.0:
            conflict_penalty += underutil_penalty
            conflict_reasons.append("The job may underutilize your skills, which could lead to dissatisfaction.")
        if conflict_penalty> 0.2:
            constraint_score = constraint_score * (1.0 - conflict_penalty)
            constraint_score = max(constraint_score, 0.0)
        graph_signal = self._resolve_graph_signal(user_doc, job_doc)
        weighted_core = (
            dynamic_weights["w_skill"] * skill_score
            + dynamic_weights["w_constraint"] * constraint_score
            + dynamic_weights["w_location"] * location_score
        )
        weighted_core = self._clip01(weighted_core)

        support_factor = 0.95 + (0.05 * attention_score)
        conflict_factor = 1.0 - (0.55 * conflict_penalty)
        match_synergy = 0.20 * (skill_score * constraint_score)

        raw_score = (weighted_core * support_factor * conflict_factor) + match_synergy + (0.03 * graph_signal)
        raw_score = self._clip01(raw_score)
        


        if conflict_penalty > 0.5:
            raw_score = raw_score * 0.5

        if skill_score > 0.7 and constraint_score > 0.7 and location_score > 0.9:
            raw_score = min(raw_score + 0.2, 1.0)
        
        probability = raw_score
        explanation = self._build_explanation(
            skill_links=skill_links,
            attention_focus=attention_focus,
            conflict_reasons=conflict_reasons,
            job_doc=job_doc,
            location_score=location_score,
        )

        result = {
            "job_id": str(job_doc.get("_id", "")),
            "posting_id": str(job_doc.get("posting_id", "")),
            "job_title": job_doc.get("jobTitle", "Unknown"),
            "company": job_doc.get("company") or job_doc.get("companyName", "Unknown"),
            "skill_score": round(skill_score, 4),
            "skill_coverage": round(skill_coverage, 4),
            "skill_gate_score": round(skill_gate_score, 4),
            "skill_gate_passed": skill_gate_passed,
            "constraint_score": round(constraint_score, 4),
            "location_score": round(location_score, 4),
            "attention_score": round(attention_score, 4),
            "conflict_penalty": round(conflict_penalty, 4),
            "graph_signal": round(graph_signal, 4),
            "raw_score": round(raw_score, 4),
            "job_score": round(probability, 4),
            "dynamic_weights": {
                "w_skill": round(dynamic_weights["w_skill"], 4),
                "w_constraint": round(dynamic_weights["w_constraint"], 4),
                "w_location": round(dynamic_weights["w_location"], 4),
            },
            "matched_skills": skill_links[: self.config.top_k_evidence],
            "attention_focus": attention_focus[: self.config.top_k_evidence],
            "conflicts": conflict_reasons[: self.config.top_k_evidence],
            "explanation": explanation,
        }

        if not skill_gate_passed:
            result["explanation"] = (
                f"{result['explanation']} Skill-confidence is lower for this role, but it is still included and ranked by overall score."
            )

        return result

    def _should_prune_job(
        self,
        user_skill_nodes: Sequence[Dict[str, Any]],
        job_doc: Dict[str, Any],
        threshold: float,
    ) -> bool:
        quick_nodes: List[Dict[str, Any]] = []

        title = job_doc.get("jobTitle_embedding")
        if isinstance(title, dict):
            node = self._make_node(title, "jobTitle", "job_title")
            if node:
                quick_nodes.append(node)

        category = job_doc.get("jobCategory_embedding")
        if isinstance(category, dict):
            node = self._make_node(category, "jobCategory", "job_category")
            if node:
                quick_nodes.append(node)

        if not quick_nodes:
            return False

        user_matrix = np.vstack([node["embedding"] for node in user_skill_nodes])
        quick_matrix = np.vstack([node["embedding"] for node in quick_nodes])
        similarity = np.matmul(user_matrix, quick_matrix.T)
        best_score = float(np.max(similarity)) if similarity.size else 0.0
        return best_score < threshold

    def _extract_user_skill_nodes(self, user_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        nodes: List[Dict[str, Any]] = []

        for item in user_doc.get("skills_embeddings", []):
            node = self._make_node(item, "skill_name", "user_skill")
            if node:
                nodes.append(node)

        qualification = user_doc.get("qualification_embedding")
        if isinstance(qualification, dict):
            node = self._make_node(qualification, "qualification", "user_qualification")
            if node:
                nodes.append(node)

        return nodes

    def _extract_constraint_nodes(self, user_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        nodes: List[Dict[str, Any]] = []

        for item in user_doc.get("constraints_embeddings", []):
            node = self._make_node(item, "constraint_text", "constraint")
            if node:
                nodes.append(node)

        return nodes

    def _extract_job_skill_nodes(self, job_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        nodes: List[Dict[str, Any]] = []

        title = job_doc.get("jobTitle_embedding")
        if isinstance(title, dict):
            node = self._make_node(title, "jobTitle", "job_title")
            if node:
                nodes.append(node)

        category = job_doc.get("jobCategory_embedding")
        if isinstance(category, dict):
            node = self._make_node(category, "jobCategory", "job_category")
            if node:
                nodes.append(node)

        for item in job_doc.get("job_requirements_embeddings", []):
            node = self._make_node(item, "requirement", "job_requirement")
            if node:
                nodes.append(node)

        for item in job_doc.get("qualifications_embeddings", []):
            node = self._make_node(item, "qualification", "qualification")
            if node:
                nodes.append(node)

        return nodes

    def _extract_job_constraint_nodes(self, job_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        nodes: List[Dict[str, Any]] = []

        location = job_doc.get("jobLocation_embedding")
        if isinstance(location, dict):
            node = self._make_node(location, "jobLocation", "job_location")
            if node:
                nodes.append(node)

        job_type = job_doc.get("jobType_embedding")
        if isinstance(job_type, dict):
            node = self._make_node(job_type, "jobType", "job_type")
            if node:
                nodes.append(node)

        experience = job_doc.get("experienceRequired_embedding")
        if isinstance(experience, dict):
            node = self._make_node(experience, "experienceRequired", "experience")
            if node:
                nodes.append(node)

        for item in job_doc.get("benefits_embeddings", []):
            node = self._make_node(item, "benefit", "benefit")
            if node:
                nodes.append(node)

        for item in job_doc.get("job_requirements_embeddings", []):
            node = self._make_node(item, "requirement", "job_requirement")
            if node:
                nodes.append(node)

        title = job_doc.get("jobTitle_embedding")
        if isinstance(title, dict):
            node = self._make_node(title, "jobTitle", "job_title")
            if node:
                nodes.append(node)

        return nodes

    def _make_node(self, item: Dict[str, Any], text_key: str, feature_type: str) -> Optional[Dict[str, Any]]:
        embedding = self._to_unit_vector(item.get("embedding"))
        if embedding is None:
            return None

        text = str(item.get(text_key, "")).strip()
        return {
            "text": text or feature_type.replace("_", " "),
            "embedding": embedding,
            "feature_type": feature_type,
        }

    def _compute_skill_match(
        self,
        user_skill_nodes: Sequence[Dict[str, Any]],
        job_skill_nodes: Sequence[Dict[str, Any]],
    ) -> Tuple[float, float, List[Dict[str, Any]]]:
        if not user_skill_nodes or not job_skill_nodes:
            return 0.0, 0.0, []

        user_matrix = np.vstack([node["embedding"] for node in user_skill_nodes])
        job_matrix = np.vstack([node["embedding"] for node in job_skill_nodes])
        similarity_matrix = np.matmul(user_matrix, job_matrix.T)

        match_rows: List[Dict[str, Any]] = []
        core_scores: List[float] = []
        auxiliary_scores: List[float] = []

        core_feature_types = {"job_requirement", "qualification"}
        auxiliary_feature_types = {"job_title", "job_category"}

        best_user_indices = np.argmax(similarity_matrix, axis=0)
        best_job_scores = np.max(similarity_matrix, axis=0)

        for job_idx, job_node in enumerate(job_skill_nodes):
            best_similarity = float(best_job_scores[job_idx]) if len(best_job_scores) else 0.0
            best_user_idx = int(best_user_indices[job_idx]) if len(best_user_indices) else 0
            best_user_node: Optional[Dict[str, Any]] = user_skill_nodes[best_user_idx] if user_skill_nodes else None

            feature_type = job_node.get("feature_type", "")
            if feature_type in core_feature_types:
                core_scores.append(best_similarity)
            elif feature_type in auxiliary_feature_types:
                auxiliary_scores.append(best_similarity)
            else:
                core_scores.append(best_similarity)

            if best_user_node is not None:
                match_rows.append(
                    {
                        "user_skill": best_user_node["text"],
                        "job_requirement": job_node["text"],
                        "similarity": round(best_similarity, 4),
                        "job_feature_type": feature_type,
                    }
                )

        if not core_scores and auxiliary_scores:
            core_scores = auxiliary_scores
            auxiliary_scores = []

        focus_count = max(1, int(np.ceil(len(core_scores) * 0.60))) if core_scores else 0
        focused_core_scores = sorted(core_scores, reverse=True)[:focus_count] if core_scores else []

        core_score = float(np.mean(core_scores)) if core_scores else 0.0
        focused_core_score = float(np.mean(focused_core_scores)) if focused_core_scores else core_score
        auxiliary_score = float(np.mean(auxiliary_scores)) if auxiliary_scores else core_score
        user_to_job_best_scores = np.max(similarity_matrix, axis=1) if similarity_matrix.size else np.array([])
        user_to_job_score = float(np.mean(user_to_job_best_scores)) if user_to_job_best_scores.size else core_score
        score = float((0.9 * focused_core_score) + (0.1 * core_score))
        
        if score > 0.5:
            score = min(score * 1.4 , 1.0)
        
        max_similarity = float(np.max(similarity_matrix))

        if max_similarity > 0.6:
            score = min(score + 0.15 , 1.0)


        relaxed_threshold = max(0.32, self.config.skill_gate_threshold - 0.08)
        coverage = (
            float(np.mean([value >= relaxed_threshold for value in focused_core_scores]))
            if focused_core_scores
            else 0.0
        )
        match_rows.sort(key=lambda item: item["similarity"], reverse=True)
        return self._clip01(score), self._clip01(coverage), match_rows

    def _compute_constraint_attention(
        self,
        constraint_nodes: Sequence[Dict[str, Any]],
        job_feature_nodes: Sequence[Dict[str, Any]],
    ) -> Tuple[float, List[Dict[str, Any]], float]:
        if not constraint_nodes:
            return 1.0, [], 0.65

        if not job_feature_nodes:
            return 0.15, [], 0.10

        constraint_matrix = np.vstack([node["embedding"] for node in constraint_nodes])
        feature_matrix = np.vstack([node["embedding"] for node in job_feature_nodes])
        support_matrix = np.clip(np.matmul(constraint_matrix, feature_matrix.T), 0.0, 1.0)

        attention_logits = support_matrix / max(self.config.attention_temperature, 1e-6)
        attention_weights = self._row_softmax(attention_logits)
        attended_support = np.sum(attention_weights * support_matrix, axis=1)
        constraint_max = np.max(support_matrix, axis=1)

        attention_score = self._clip01(float(np.mean(attended_support)))
        compatibility_score = float(np.mean(constraint_max))

        # BOOST
        compatibility_score = min(compatibility_score * 1.3, 1.0)
        focus_rows: List[Dict[str, Any]] = []
        for row_index, constraint in enumerate(constraint_nodes):
            constraint_text = constraint["text"].lower()
            if any(word in constraint_text for word in ['close to home', 'near home', 'nearby', 'near my home','near me', 'close by']):
                for j , feature in enumerate(job_feature_nodes):
                    if feature["feature_type"] == "job_location":
                        support_matrix[row_index,j] = 1.0
                compatibility_score = max(compatibility_score, 0.85)
            top_feature_index = int(np.argmax(attention_weights[row_index]))
            focus_rows.append(
                {
                    "constraint": constraint["text"],
                    "focused_feature": job_feature_nodes[top_feature_index]["text"],
                    "feature_type": job_feature_nodes[top_feature_index]["feature_type"],
                    "attention_weight": round(float(attention_weights[row_index][top_feature_index]), 4),
                    "support_score": round(float(support_matrix[row_index][top_feature_index]), 4),
                }
            )

        focus_rows.sort(key=lambda item: item["attention_weight"], reverse=True)
        return attention_score, focus_rows, compatibility_score

    def _compute_location_score(
        self,
        user_doc: Dict[str, Any],
        job_doc: Dict[str, Any],
        constraint_nodes: Sequence[Dict[str, Any]],
    ) -> float:
        constraint_text = self._all_constraint_text(constraint_nodes)
        remote_preferred = self._contains_any(constraint_text, REMOTE_KEYWORDS)

        job_location = job_doc.get("jobLocation_embedding")
        job_location_text = self._normalized_text(
            (job_location or {}).get("jobLocation", "") if isinstance(job_location, dict) else ""
        )
        job_is_remote = self._contains_any(job_location_text, REMOTE_KEYWORDS) or self._job_supports_remote(job_doc)

        if remote_preferred and job_is_remote:
            return 1.0
        if remote_preferred and not job_is_remote:
            return 0.15

        user_location = user_doc.get("location_embedding")
        if not isinstance(user_location, dict) or not isinstance(job_location, dict):
            return 0.5 if not remote_preferred else 0.25

        user_embedding = self._to_unit_vector(user_location.get("embedding"))
        job_embedding = self._to_unit_vector(job_location.get("embedding"))
        if user_embedding is None or job_embedding is None:
            return 0.5

        similarity = self._cosine_similarity(user_embedding, job_embedding)
        if job_is_remote:
            similarity = max(similarity, 0.75)
        return self._clip01(similarity)

    def _generate_dynamic_weights(
        self,
        user_doc: Dict[str, Any],
        constraint_nodes: Sequence[Dict[str, Any]],
    ) -> Dict[str, float]:
        if self.weight_predictor is not None:
            try:
                predicted_weights = self.weight_predictor.predict(user_doc, constraint_nodes)
                if predicted_weights:
                    return {
                        "w_skill": self._bounded_float(predicted_weights.get("w_skill", 0.0)),
                        "w_constraint": self._bounded_float(predicted_weights.get("w_constraint", 0.0)),
                        "w_location": self._bounded_float(predicted_weights.get("w_location", 0.0)),
                    }
            except Exception:
                pass

        skills_count = len(user_doc.get("skills_embeddings", []))
        constraints_text = self._all_constraint_text(constraint_nodes)

        skill_density = min(skills_count / 8.0, 1.0)
        constraint_density = min(len(user_doc.get("constraints_embeddings", [])) / 5.0, 1.0)
        remote_preference = 1.0 if self._contains_any(constraints_text, REMOTE_KEYWORDS) else 0.0
        schedule_rigidity = 1.0 if self._contains_any(constraints_text, EVENING_KEYWORDS | WEEKEND_KEYWORDS | DAYTIME_KEYWORDS) else 0.0
        care_or_accessibility = 1.0 if self._contains_any(constraints_text, CARE_KEYWORDS | ACCESSIBILITY_KEYWORDS) else 0.0
        location_anchor = 1.0 if user_doc.get("location_embedding") else 0.0

        context_vector = np.array(
            [
                1.0,
                skill_density,
                constraint_density,
                remote_preference,
                schedule_rigidity,
                care_or_accessibility,
                location_anchor,
            ],
            dtype=float,
        )

        hypernetwork_weights = np.array(
            [
                [1.20, 0.95, 0.55],
                [1.10, -0.10, 0.05],
                [-0.30, 1.05, 0.10],
                [-0.25, 0.35, 1.15],
                [-0.10, 0.95, 0.15],
                [-0.05, 0.85, 0.25],
                [0.05, 0.10, 0.85],
            ],
            dtype=float,
        )

        logits = np.matmul(context_vector, hypernetwork_weights)
        weights = self._softmax(logits)

        w_skill = float(weights[0])       
        w_constraint = float( weights[1])  
        w_location = float(weights[2])

        skills_count = len(user_doc.get("skills_embeddings", []))
        constraints_count = len(user_doc.get("constraints_embeddings", []))

        skill_density = min(skills_count / 8.0, 1.0)
        constraint_density = min(constraints_count / 5.0, 1.0)

        if skill_density > 0.6:
            w_skill += 0.15 

        if constraint_density > 0.6:
            w_constraint += 0.05  

        if skill_density >0.7:
            w_skill = max(w_skill, 0.55)
        w_constraint = min(w_constraint, 0.4)
        w_skill = max(w_skill, 0.4)   
        
        total = w_skill + w_constraint + w_location
        
        return {
            "w_skill": w_skill / total,
            "w_constraint": w_constraint / total,
            "w_location": w_location / total,
        }

    def _resolve_graph_signal(self, user_doc: Dict[str, Any], job_doc: Dict[str, Any]) -> float:
        if self.graph_signal_provider is not None:
            try:
                user_id = str(user_doc.get("user_id", ""))
                job_id = str(job_doc.get("_id", ""))
                posting_id = str(job_doc.get("posting_id", ""))
                graph_signal = self.graph_signal_provider.score(user_id=user_id, job_id=job_id, posting_id=posting_id)
                return self._bounded_float(graph_signal)
            except Exception:
                pass

        return self._bounded_float(job_doc.get("graph_signal", 0.0))

    def _detect_conflicts(
        self,
        constraint_nodes: Sequence[Dict[str, Any]],
        job_doc: Dict[str, Any],
        job_feature_nodes: Sequence[Dict[str, Any]],
    ) -> Tuple[float, List[str]]:
        if not constraint_nodes:
            return 0.0, []

        reasons: List[str] = []
        penalties: List[float] = []
        full_job_text = self._job_text_blob(job_doc, job_feature_nodes)
        job_is_remote = self._job_supports_remote(job_doc)
        job_is_onsite = self._contains_any(full_job_text, ONSITE_KEYWORDS)
        job_has_weekend = self._contains_any(full_job_text, WEEKEND_KEYWORDS)
        job_has_evening = self._contains_any(full_job_text, EVENING_KEYWORDS)
        job_has_physical_demands = self._contains_any(full_job_text, PHYSICAL_DEMAND_KEYWORDS)
        job_has_travel = self._contains_any(full_job_text, TRAVEL_KEYWORDS)

        for constraint in constraint_nodes:
            text = self._normalized_text(constraint["text"])
            embedding = constraint["embedding"]

            constraint_text = text
            job_text = full_job_text.lower()

            # detect if constraint talks about time restriction
            time_words = ["night", "evening", "late", "after"]
            negative_words = ["cannot", "cant", "no", "not"]

            is_time_constraint = any(word in constraint_text for word in time_words)
            is_negative = any(word in constraint_text for word in negative_words)

            # detect job has night/late shift
            job_has_night = any(word in job_text for word in ["night", "overnight", "pm", "late", "am"])
                    
            if is_time_constraint and is_negative and job_has_night:
                penalties.append(0.85)
                reasons.append("Time constraint conflict: user cannot work late but job requires night shift.")
            if self._contains_any(text, {"part time", "part-time"}) and "full-time" in full_job_text:
                penalties.append(0.1)
                reasons.append("User prefers part-time but job is full-time.")
            if self._contains_any(text, REMOTE_KEYWORDS) and job_is_onsite and not job_is_remote:
                penalties.append(self._semantic_penalty(0.35, embedding, job_feature_nodes))
                reasons.append("Remote-only preference conflicts with an on-site or office-based job setting.")

            if self._mentions_no_weekends(text) and job_has_weekend:
                penalties.append(self._semantic_penalty(0.25, embedding, job_feature_nodes))
                reasons.append("Weekend availability constraint conflicts with weekend work mentioned in the job.")

            if self._mentions_daytime_only(text) and job_has_evening:
                penalties.append(self._semantic_penalty(0.30, embedding, job_feature_nodes))
                reasons.append("Daytime availability conflicts with evening, night, or shift-based work.")

            if self._mentions_cannot_travel(text) and job_has_travel:
                penalties.append(self._semantic_penalty(0.35, embedding, job_feature_nodes))
                reasons.append("Travel or relocation requirements conflict with limited mobility or travel constraints.")

            if self._contains_any(text, ACCESSIBILITY_KEYWORDS) and job_has_physical_demands:
                penalties.append(self._semantic_penalty(0.30, embedding, job_feature_nodes))
                reasons.append("Accessibility-related needs may conflict with physically demanding job duties.")

            time_penalty, time_reason = self._detect_time_conflict(text, embedding, job_feature_nodes, full_job_text)

            if time_penalty not in  reasons:
                penalties.append(time_penalty)
                reasons.append(time_reason)

        total_penalty = min(sum(penalties), self.config.max_conflict_penalty)
        unique_reasons = list(dict.fromkeys(reasons))
        return self._clip01(total_penalty), unique_reasons

    def _detect_time_conflict(
        self,
        constraint_text: str,
        constraint_embedding: np.ndarray,
        job_feature_nodes: Sequence[Dict[str, Any]],
        full_job_text: str,
    ) -> Tuple[float, str]:
        max_end = self._extract_after_cutoff(constraint_text)
        min_start = self._extract_before_cutoff(constraint_text)
        shift_windows = self._extract_shift_windows(full_job_text)

        if max_end is not None:
            for start_hour, end_hour in shift_windows:
                if end_hour < start_hour:
                    end_hour += 24
                if end_hour > max_end + 0.5 and start_hour >= 12:
                    penalty = self._semantic_penalty(0.35, constraint_embedding, job_feature_nodes)
                    return penalty, (
                        f"Time restriction after {self._format_hour(max_end)} conflicts with a job shift ending around "
                        f"{self._format_hour(end_hour)}."
                    )
            if self._contains_any(full_job_text, EVENING_KEYWORDS):
                penalty = self._semantic_penalty(0.22, constraint_embedding, job_feature_nodes)
                return penalty, "Time restriction conflicts with evening or late-hour language in the job."

        if min_start is not None:
            for start_hour, _ in shift_windows:
                if start_hour < min_start:
                    penalty = self._semantic_penalty(0.30, constraint_embedding, job_feature_nodes)
                    return penalty, (
                        f"Start-time restriction before {self._format_hour(min_start)} conflicts with a job shift beginning "
                        f"around {self._format_hour(start_hour)}."
                    )

        return 0.0, ""

    def _semantic_penalty(
        self,
        base_penalty: float,
        constraint_embedding: np.ndarray,
        job_feature_nodes: Sequence[Dict[str, Any]],
    ) -> float:
        if not job_feature_nodes:
            return base_penalty

        similarities = [
            self._cosine_similarity(constraint_embedding, feature_node["embedding"])
            for feature_node in job_feature_nodes
        ]
        semantic_strength = max(similarities) if similarities else 0.0
        boosted_penalty = base_penalty + (0.20 * semantic_strength)
        return self._clip01(boosted_penalty)
    def _detect_underutilization(self, user_skill_nodes, job_skill_nodes):
        if not user_skill_nodes or not job_skill_nodes:
            return 0.0

        user_matrix = np.vstack([n["embedding"] for n in user_skill_nodes])
        job_matrix = np.vstack([n["embedding"] for n in job_skill_nodes])

        sim_matrix = np.matmul(user_matrix, job_matrix.T)

        # how well job uses user skills
        job_best = np.max(sim_matrix, axis=1)   # for each user skill

        avg_utilization = float(np.mean(job_best))

        # 🔥 KEY LOGIC
        if avg_utilization < 0.45:
            return 0.3
        elif avg_utilization < 0.6:
            return 0.15
        return 0.0
    def _build_explanation(
        self,
        skill_links: Sequence[Dict[str, Any]],
        attention_focus: Sequence[Dict[str, Any]],
        conflict_reasons: Sequence[str],
        job_doc: Dict[str, Any],
        location_score: float,
    ) -> str:
        evidence_parts: List[str] = []

        if skill_links:
            top_skill = skill_links[0]
            evidence_parts.append(
                f"your {top_skill['user_skill']} profile signal aligns with {top_skill['job_requirement']}"
            )

        if attention_focus:
            top_focus = attention_focus[0]
            focus_phrase = "is supported by" if not conflict_reasons else "most strongly attends to"
            evidence_parts.append(
                f"the constraint '{top_focus['constraint']}' {focus_phrase} the job feature '{top_focus['focused_feature']}'"
            )

        if location_score >= 0.95:
            job_location = (job_doc.get("jobLocation_embedding") or {}).get("jobLocation", "the job location")
            evidence_parts.append(f"location compatibility is strong for {job_location}")

        if not evidence_parts:
            evidence_parts.append("the combined skill, constraint, and location signals are favorable")

        explanation = "Recommended because " + " and ".join(evidence_parts) + "."
        if conflict_reasons:
            explanation += f" Caution: {conflict_reasons[0]}"
        return explanation

    def _job_supports_remote(self, job_doc: Dict[str, Any]) -> bool:
        text_chunks = []

        location = job_doc.get("jobLocation_embedding")
        if isinstance(location, dict):
            text_chunks.append(location.get("jobLocation", ""))

        job_type = job_doc.get("jobType_embedding")
        if isinstance(job_type, dict):
            text_chunks.append(job_type.get("jobType", ""))

        text_chunks.extend(item.get("benefit", "") for item in job_doc.get("benefits_embeddings", []))
        text_blob = self._normalized_text(" ".join(text_chunks))
        return self._contains_any(text_blob, REMOTE_KEYWORDS)

    def _job_text_blob(self, job_doc: Dict[str, Any], job_feature_nodes: Sequence[Dict[str, Any]]) -> str:
        text_parts = [
            str(job_doc.get("jobTitle", "")),
            str(job_doc.get("company", "")),
            str(job_doc.get("jobDescription_text", "")),
            str(job_doc.get("jobLocation_text", "")),
            str(job_doc.get("jobType_text", "")),
            str(job_doc.get("benefits_text", "")),
            str(job_doc.get("requiredQualifications_text", "")),
            str(job_doc.get("experienceRequired_text", "")),
        ]
        text_parts.extend(feature["text"] for feature in job_feature_nodes)
        return self._normalized_text(" ".join(part for part in text_parts if part))

    def _all_constraint_text(self, constraint_nodes: Sequence[Dict[str, Any]]) -> str:
        return self._normalized_text(" ".join(node["text"] for node in constraint_nodes))

    def _contains_any(self, text: str, keywords: Sequence[str] | set[str]) -> bool:
        text = self._normalized_text(text)
        return any(keyword in text for keyword in keywords)

    def _mentions_no_weekends(self, text: str) -> bool:
        return self._contains_any(text, {"no weekend", "cannot work weekend", "cant work weekend", "weekends off", "not available on weekends"})

    def _mentions_daytime_only(self, text: str) -> bool:
        return self._contains_any(
            text,
            {
                "cannot work after",
                "cant work after",
                "daytime",
                "day shift only",
                "no night",
                "no evening",
                "school hours",
                "childcare",
            },
        )

    def _mentions_cannot_travel(self, text: str) -> bool:
        return self._contains_any(
            text,
            {
                "cannot travel",
                "cant travel",
                "no travel",
                "cannot relocate",
                "cant relocate",
                "no relocation",
            },
        )

    def _extract_after_cutoff(self, text: str) -> Optional[float]:
        patterns = [
            r"(?:cannot|cant|can not|not available|unable to)\s+work\s+after\s+(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?))",
            r"after\s+(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?))",
        ]
        if "night" in text:
            return 21.0   # assume 8 PM cutoff
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return self._parse_time_token(match.group(1))
        return None

    def _extract_before_cutoff(self, text: str) -> Optional[float]:
        patterns = [
            r"(?:cannot|cant|can not|not available|unable to)\s+work\s+before\s+(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?))",
            r"before\s+(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?))",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return self._parse_time_token(match.group(1))
        return None

    def _extract_shift_windows(self, text: str) -> List[Tuple[float, float]]:
        windows: List[Tuple[float, float]] = []

        for start_token, end_token in SHIFT_RANGE_PATTERN.findall(text):
            start_hour = self._parse_time_token(start_token)
            end_hour = self._parse_time_token(end_token)
            if start_hour is not None and end_hour is not None:
                windows.append((start_hour, end_hour))

        if not windows:
            times = [self._parse_time_token(match.group(0)) for match in TIME_PATTERN.finditer(text)]
            times = [hour for hour in times if hour is not None]
            if len(times) >= 2:
                windows.extend((times[index], times[index + 1]) for index in range(0, len(times) - 1, 2))

        return windows

    def _parse_time_token(self, token: str) -> Optional[float]:
        match = TIME_PATTERN.search(token)
        if not match:
            return None

        hour = int(match.group(1))
        minute = int(match.group(2) or 0)
        ampm = match.group(3).lower()

        if "p" in ampm and hour != 12:
            hour += 12
        if "a" in ampm and hour == 12:
            hour = 0

        return hour + (minute / 60.0)

    def _format_hour(self, hour: float) -> str:
        whole_hour = int(hour)
        minute = int(round((hour - whole_hour) * 60))
        suffix = "AM"

        if whole_hour >= 12:
            suffix = "PM"
        display_hour = whole_hour % 12
        if display_hour == 0:
            display_hour = 12

        if minute == 0:
            return f"{display_hour} {suffix}"
        return f"{display_hour}:{minute:02d} {suffix}"

    def _to_unit_vector(self, embedding: Any) -> Optional[np.ndarray]:
        if embedding is None:
            return None

        try:
            vector = np.asarray(embedding, dtype=float).reshape(-1)
        except Exception:
            return None

        if vector.size == 0:
            return None

        norm = float(np.linalg.norm(vector))
        if norm == 0.0:
            return None

        return vector / norm

    def _cosine_similarity(self, vector_a: np.ndarray, vector_b: np.ndarray) -> float:
        return self._clip01(float(np.dot(vector_a, vector_b)))

    def _row_softmax(self, matrix: np.ndarray) -> np.ndarray:
        matrix = matrix - np.max(matrix, axis=1, keepdims=True)
        exponent = np.exp(matrix)
        denominator = np.sum(exponent, axis=1, keepdims=True)
        return exponent / np.clip(denominator, 1e-8, None)

    def _softmax(self, vector: np.ndarray) -> np.ndarray:
        vector = vector - np.max(vector)
        exponent = np.exp(vector)
        return exponent / np.clip(np.sum(exponent), 1e-8, None)

    def _sigmoid(self, value: float) -> float:
        return 1.0 / (1.0 + math.exp(-value))

    def _normalized_text(self, text: str) -> str:
        return " ".join(str(text).lower().split())

    def _bounded_float(self, value: Any) -> float:
        try:
            return self._clip01(float(value))
        except Exception:
            return 0.0

    def _clip01(self, value: float) -> float:
        return max(0.0, min(1.0, value))
