from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np

try:
    import torch
    from torch import nn
except Exception:  # pragma: no cover - fallback for environments without torch
    torch = None
    nn = None


def _to_unit_vector(embedding: Any) -> Optional[np.ndarray]:
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


def _mean_vectors(vectors: Sequence[np.ndarray], dim: int = 384) -> np.ndarray:
    if not vectors:
        return np.zeros(dim, dtype=np.float32)
    return np.mean(np.stack(vectors), axis=0).astype(np.float32)


def _normalize_key(text: str) -> str:
    return " ".join(str(text).lower().split())


def _collect_node_vector(items: Sequence[Dict[str, Any]]) -> List[np.ndarray]:
    vectors: List[np.ndarray] = []
    for item in items:
        vector = _to_unit_vector(item.get("embedding"))
        if vector is not None:
            vectors.append(vector)
    return vectors


@dataclass
class GraphPair:
    user_index: int
    job_index: int
    label: float
    weight: float


@dataclass
class GraphData:
    node_features: np.ndarray
    edge_index_by_relation: Dict[str, Tuple[np.ndarray, np.ndarray]]
    user_node_indices: Dict[str, int]
    job_node_indices: Dict[str, int]
    posting_to_job_id: Dict[str, str]
    training_pairs: List[GraphPair]
    embedding_dim: int


class HeteroGraphBuilder:
    def build(
        self,
        user_docs: Sequence[Dict[str, Any]],
        job_docs: Sequence[Dict[str, Any]],
        pseudo_labels: Sequence[Any],
    ) -> GraphData:
        dimension = self._infer_dimension(user_docs, job_docs)
        node_features: List[np.ndarray] = []
        node_index: Dict[Tuple[str, str], int] = {}
        edges: Dict[str, List[Tuple[int, int]]] = {}
        user_node_indices: Dict[str, int] = {}
        job_node_indices: Dict[str, int] = {}
        posting_to_job_id: Dict[str, str] = {}

        skill_vectors = self._aggregate_shared_vectors(user_docs, job_docs, dimension, category="skill")
        constraint_vectors = self._aggregate_shared_vectors(user_docs, job_docs, dimension, category="constraint")
        location_vectors = self._aggregate_shared_vectors(user_docs, job_docs, dimension, category="location")

        def register(node_type: str, external_id: str, feature: np.ndarray) -> int:
            key = (node_type, external_id)
            if key not in node_index:
                node_index[key] = len(node_features)
                node_features.append(feature.astype(np.float32))
            return node_index[key]

        for user_doc in user_docs:
            user_id = str(user_doc.get("user_id", ""))
            if not user_id:
                continue
            feature = self._build_user_feature(user_doc, dimension)
            user_idx = register("user", user_id, feature)
            user_node_indices[user_id] = user_idx

        for job_doc in job_docs:
            job_id = str(job_doc.get("_id", ""))
            if not job_id:
                continue
            feature = self._build_job_feature(job_doc, dimension)
            job_idx = register("job", job_id, feature)
            job_node_indices[job_id] = job_idx
            posting_id = str(job_doc.get("posting_id", ""))
            if posting_id:
                posting_to_job_id[posting_id] = job_id

        for skill_key, vector in skill_vectors.items():
            register("skill", skill_key, vector)

        for constraint_key, vector in constraint_vectors.items():
            register("constraint", constraint_key, vector)

        for location_key, vector in location_vectors.items():
            register("location", location_key, vector)

        for user_doc in user_docs:
            user_id = str(user_doc.get("user_id", ""))
            user_idx = user_node_indices.get(user_id)
            if user_idx is None:
                continue

            for skill in user_doc.get("skills_embeddings", []):
                skill_key = _normalize_key(skill.get("skill_name", ""))
                self._append_bidirectional_edge(edges, "user_has_skill", user_idx, node_index.get(("skill", skill_key)))

            for constraint in user_doc.get("constraints_embeddings", []):
                constraint_key = _normalize_key(constraint.get("constraint_text", ""))
                self._append_bidirectional_edge(edges, "user_has_constraint", user_idx, node_index.get(("constraint", constraint_key)))

            location = user_doc.get("location_embedding")
            if isinstance(location, dict):
                location_key = _normalize_key(location.get("location", ""))
                self._append_bidirectional_edge(edges, "user_in_location", user_idx, node_index.get(("location", location_key)))

        for job_doc in job_docs:
            job_id = str(job_doc.get("_id", ""))
            job_idx = job_node_indices.get(job_id)
            if job_idx is None:
                continue

            for requirement in job_doc.get("job_requirements_embeddings", []):
                skill_key = _normalize_key(requirement.get("requirement", ""))
                self._append_bidirectional_edge(edges, "job_requires_skill", job_idx, node_index.get(("skill", skill_key)))

            for qualification in job_doc.get("qualifications_embeddings", []):
                skill_key = _normalize_key(qualification.get("qualification", ""))
                self._append_bidirectional_edge(edges, "job_requires_skill", job_idx, node_index.get(("skill", skill_key)))

            for benefit in job_doc.get("benefits_embeddings", []):
                constraint_key = _normalize_key(benefit.get("benefit", ""))
                if ("constraint", constraint_key) in node_index:
                    self._append_bidirectional_edge(edges, "job_supports_constraint", job_idx, node_index.get(("constraint", constraint_key)))

            location = job_doc.get("jobLocation_embedding")
            if isinstance(location, dict):
                location_key = _normalize_key(location.get("jobLocation", ""))
                self._append_bidirectional_edge(edges, "job_in_location", job_idx, node_index.get(("location", location_key)))

        training_pairs: List[GraphPair] = []
        for record in pseudo_labels:
            user_idx = user_node_indices.get(str(record.user_id))
            job_idx = job_node_indices.get(str(record.job_id))
            if user_idx is None or job_idx is None:
                continue
            training_pairs.append(
                GraphPair(
                    user_index=user_idx,
                    job_index=job_idx,
                    label=float(record.label),
                    weight=float(record.sample_weight),
                )
            )
            if int(record.label) == 1:
                self._append_bidirectional_edge(edges, "pseudo_positive_match", user_idx, job_idx)

        edge_index_by_relation = {
            relation: (
                np.array([src for src, _ in relation_edges], dtype=np.int64),
                np.array([dst for _, dst in relation_edges], dtype=np.int64),
            )
            for relation, relation_edges in edges.items()
            if relation_edges
        }

        return GraphData(
            node_features=np.stack(node_features).astype(np.float32) if node_features else np.zeros((0, dimension), dtype=np.float32),
            edge_index_by_relation=edge_index_by_relation,
            user_node_indices=user_node_indices,
            job_node_indices=job_node_indices,
            posting_to_job_id=posting_to_job_id,
            training_pairs=training_pairs,
            embedding_dim=dimension,
        )

    def _infer_dimension(self, user_docs: Sequence[Dict[str, Any]], job_docs: Sequence[Dict[str, Any]]) -> int:
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
                        vector = _to_unit_vector(item.get("embedding"))
                        if vector is not None:
                            return int(vector.shape[0])
        return 384

    def _build_user_feature(self, user_doc: Dict[str, Any], dimension: int) -> np.ndarray:
        vectors = []
        vectors.extend(_collect_node_vector(user_doc.get("skills_embeddings", [])))
        vectors.extend(_collect_node_vector(user_doc.get("constraints_embeddings", [])))

        qualification = user_doc.get("qualification_embedding")
        if isinstance(qualification, dict):
            vector = _to_unit_vector(qualification.get("embedding"))
            if vector is not None:
                vectors.append(vector)

        location = user_doc.get("location_embedding")
        if isinstance(location, dict):
            vector = _to_unit_vector(location.get("embedding"))
            if vector is not None:
                vectors.append(vector)

        return _mean_vectors(vectors, dim=dimension)

    def _build_job_feature(self, job_doc: Dict[str, Any], dimension: int) -> np.ndarray:
        vectors = []
        vectors.extend(_collect_node_vector(job_doc.get("job_requirements_embeddings", [])))
        vectors.extend(_collect_node_vector(job_doc.get("qualifications_embeddings", [])))
        vectors.extend(_collect_node_vector(job_doc.get("benefits_embeddings", [])))

        for field in ["jobTitle_embedding", "jobCategory_embedding", "experienceRequired_embedding", "jobLocation_embedding", "jobType_embedding"]:
            payload = job_doc.get(field)
            if isinstance(payload, dict):
                vector = _to_unit_vector(payload.get("embedding"))
                if vector is not None:
                    vectors.append(vector)

        return _mean_vectors(vectors, dim=dimension)

    def _aggregate_shared_vectors(
        self,
        user_docs: Sequence[Dict[str, Any]],
        job_docs: Sequence[Dict[str, Any]],
        dimension: int,
        category: str,
    ) -> Dict[str, np.ndarray]:
        buckets: Dict[str, List[np.ndarray]] = {}

        if category == "skill":
            for user_doc in user_docs:
                for skill in user_doc.get("skills_embeddings", []):
                    self._append_vector_bucket(buckets, skill.get("skill_name", ""), skill.get("embedding"))
            for job_doc in job_docs:
                for requirement in job_doc.get("job_requirements_embeddings", []):
                    self._append_vector_bucket(buckets, requirement.get("requirement", ""), requirement.get("embedding"))
                for qualification in job_doc.get("qualifications_embeddings", []):
                    self._append_vector_bucket(buckets, qualification.get("qualification", ""), qualification.get("embedding"))

        elif category == "constraint":
            for user_doc in user_docs:
                for constraint in user_doc.get("constraints_embeddings", []):
                    self._append_vector_bucket(buckets, constraint.get("constraint_text", ""), constraint.get("embedding"))
            for job_doc in job_docs:
                for benefit in job_doc.get("benefits_embeddings", []):
                    self._append_vector_bucket(buckets, benefit.get("benefit", ""), benefit.get("embedding"))

        elif category == "location":
            for user_doc in user_docs:
                location = user_doc.get("location_embedding")
                if isinstance(location, dict):
                    self._append_vector_bucket(buckets, location.get("location", ""), location.get("embedding"))
            for job_doc in job_docs:
                location = job_doc.get("jobLocation_embedding")
                if isinstance(location, dict):
                    self._append_vector_bucket(buckets, location.get("jobLocation", ""), location.get("embedding"))

        return {key: _mean_vectors(vectors, dim=dimension) for key, vectors in buckets.items()}

    def _append_vector_bucket(self, buckets: Dict[str, List[np.ndarray]], text: str, embedding: Any) -> None:
        key = _normalize_key(text)
        if not key:
            return
        vector = _to_unit_vector(embedding)
        if vector is None:
            return
        buckets.setdefault(key, []).append(vector)

    def _append_bidirectional_edge(
        self,
        edges: Dict[str, List[Tuple[int, int]]],
        relation: str,
        src_idx: Optional[int],
        dst_idx: Optional[int],
    ) -> None:
        if src_idx is None or dst_idx is None:
            return
        edges.setdefault(relation, []).append((src_idx, dst_idx))
        edges.setdefault(f"{relation}_rev", []).append((dst_idx, src_idx))


if torch is not None:
    class RelationConv(nn.Module):
        def __init__(self, input_dim: int, output_dim: int, relation_names: Sequence[str]):
            super().__init__()
            self.self_linear = nn.Linear(input_dim, output_dim)
            self.relation_linears = nn.ModuleDict(
                {relation: nn.Linear(input_dim, output_dim, bias=False) for relation in relation_names}
            )

        def forward(self, node_features: torch.Tensor, edge_tensors: Dict[str, Tuple[torch.Tensor, torch.Tensor]]) -> torch.Tensor:
            output = self.self_linear(node_features)
            aggregate = torch.zeros_like(output)
            counts = torch.zeros((node_features.size(0), 1), dtype=node_features.dtype, device=node_features.device)

            for relation, (src_idx, dst_idx) in edge_tensors.items():
                if src_idx.numel() == 0:
                    continue
                messages = self.relation_linears[relation](node_features[src_idx])
                aggregate.index_add_(0, dst_idx, messages)
                ones = torch.ones((dst_idx.size(0), 1), dtype=node_features.dtype, device=node_features.device)
                counts.index_add_(0, dst_idx, ones)

            aggregate = aggregate / counts.clamp(min=1.0)
            return torch.relu(output + aggregate)


    class RelationalGraphEncoder(nn.Module):
        def __init__(self, input_dim: int, hidden_dim: int, relation_names: Sequence[str]):
            super().__init__()
            self.layer1 = RelationConv(input_dim, hidden_dim, relation_names)
            self.layer2 = RelationConv(hidden_dim, hidden_dim, relation_names)

        def forward(self, node_features: torch.Tensor, edge_tensors: Dict[str, Tuple[torch.Tensor, torch.Tensor]]) -> torch.Tensor:
            hidden = self.layer1(node_features, edge_tensors)
            return self.layer2(hidden, edge_tensors)


def train_graph_model(
    graph_data: GraphData,
    output_path: str,
    hidden_dim: int = 64,
    epochs: int = 180,
    learning_rate: float = 1e-3,
) -> Dict[str, Any]:
    if torch is None or nn is None:
        raise RuntimeError("PyTorch is required to train the graph model.")

    if graph_data.node_features.shape[0] == 0 or not graph_data.training_pairs:
        raise ValueError("Graph data is empty or has no training pairs.")

    relation_names = list(graph_data.edge_index_by_relation.keys())
    model = RelationalGraphEncoder(graph_data.embedding_dim, hidden_dim, relation_names)
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    criterion = nn.BCEWithLogitsLoss(reduction="none")

    node_features = torch.tensor(graph_data.node_features, dtype=torch.float32)
    edge_tensors = {
        relation: (
            torch.tensor(src_idx, dtype=torch.long),
            torch.tensor(dst_idx, dtype=torch.long),
        )
        for relation, (src_idx, dst_idx) in graph_data.edge_index_by_relation.items()
    }
    user_indices = torch.tensor([pair.user_index for pair in graph_data.training_pairs], dtype=torch.long)
    job_indices = torch.tensor([pair.job_index for pair in graph_data.training_pairs], dtype=torch.long)
    labels = torch.tensor([pair.label for pair in graph_data.training_pairs], dtype=torch.float32)
    weights = torch.tensor([pair.weight for pair in graph_data.training_pairs], dtype=torch.float32)

    for _ in range(epochs):
        optimizer.zero_grad()
        embeddings = model(node_features, edge_tensors)
        logits = (embeddings[user_indices] * embeddings[job_indices]).sum(dim=-1)
        loss = criterion(logits, labels)
        loss = (loss * weights).mean()
        loss.backward()
        optimizer.step()

    model.eval()
    with torch.no_grad():
        embeddings = model(node_features, edge_tensors)
        logits = (embeddings[user_indices] * embeddings[job_indices]).sum(dim=-1)
        probabilities = torch.sigmoid(logits)
        predictions = (probabilities >= 0.5).float()
        accuracy = float((predictions == labels).float().mean().item())

        user_embeddings = {
            user_id: embeddings[node_idx].cpu().numpy().tolist()
            for user_id, node_idx in graph_data.user_node_indices.items()
        }
        job_embeddings = {
            job_id: embeddings[node_idx].cpu().numpy().tolist()
            for job_id, node_idx in graph_data.job_node_indices.items()
        }

    artifact = {
        "model_state_dict": model.state_dict(),
        "input_dim": graph_data.embedding_dim,
        "hidden_dim": hidden_dim,
        "relations": relation_names,
        "user_embeddings": user_embeddings,
        "job_embeddings": job_embeddings,
        "posting_to_job_id": graph_data.posting_to_job_id,
        "training_accuracy": accuracy,
    }
    torch.save(artifact, output_path)
    return artifact


class GraphSignalProvider:
    def __init__(self, user_embeddings: Dict[str, np.ndarray], job_embeddings: Dict[str, np.ndarray], posting_to_job_id: Dict[str, str]):
        self.user_embeddings = user_embeddings
        self.job_embeddings = job_embeddings
        self.posting_to_job_id = posting_to_job_id

    @classmethod
    def load(cls, artifact_path: str) -> "GraphSignalProvider":
        if torch is None:
            raise RuntimeError("PyTorch is required to load the graph artifact.")

        artifact = torch.load(artifact_path, map_location="cpu")
        user_embeddings = {key: np.asarray(value, dtype=np.float32) for key, value in artifact.get("user_embeddings", {}).items()}
        job_embeddings = {key: np.asarray(value, dtype=np.float32) for key, value in artifact.get("job_embeddings", {}).items()}
        posting_to_job_id = {key: value for key, value in artifact.get("posting_to_job_id", {}).items()}
        return cls(user_embeddings=user_embeddings, job_embeddings=job_embeddings, posting_to_job_id=posting_to_job_id)

    def score(self, user_id: str, job_id: str = "", posting_id: str = "") -> float:
        user_vector = self.user_embeddings.get(str(user_id))
        resolved_job_id = str(job_id) if str(job_id) in self.job_embeddings else self.posting_to_job_id.get(str(posting_id), "")
        job_vector = self.job_embeddings.get(resolved_job_id)
        if user_vector is None or job_vector is None:
            return 0.0

        similarity = float(np.dot(user_vector, job_vector))
        return float(1.0 / (1.0 + np.exp(-similarity)))
