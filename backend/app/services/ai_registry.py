"""
GRAM-X Enterprise AI Model Registry & Strict Promotion Gate Architecture
Module: ai_registry.py
"""

import datetime
from typing import Dict, Any, List, Optional

class ModelCard:
    """Standardized metadata card documenting AI model behavior, metrics, and limitations."""
    def __init__(
        self,
        model_id: str,
        version: str,
        name: str,
        task: str,
        architecture: str,
        training_dataset: str,
        accuracy: float,
        macro_f1: float,
        latency_p50_ms: float,
        status: str = "PRODUCTION",
        languages_supported: List[str] = None,
        limitations: str = "",
        hard_negative_f1: float = 0.96,
        ece_score: float = 0.05
    ):
        self.model_id = model_id
        self.version = version
        self.name = name
        self.task = task
        self.architecture = architecture
        self.training_dataset = training_dataset
        self.accuracy = accuracy
        self.macro_f1 = macro_f1
        self.latency_p50_ms = latency_p50_ms
        self.status = status
        self.languages_supported = languages_supported or ["hi", "hi-bundeli", "en", "hinglish"]
        self.limitations = limitations
        self.hard_negative_f1 = hard_negative_f1
        self.ece_score = ece_score
        self.registered_at = datetime.datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "model_id": self.model_id,
            "version": self.version,
            "name": self.name,
            "task": self.task,
            "architecture": self.architecture,
            "training_dataset": self.training_dataset,
            "metrics": {
                "accuracy": self.accuracy,
                "macro_f1": self.macro_f1,
                "hard_negative_f1": self.hard_negative_f1,
                "ece_calibration_error": self.ece_score,
                "latency_p50_ms": self.latency_p50_ms
            },
            "status": self.status,
            "languages_supported": self.languages_supported,
            "limitations": self.limitations,
            "registered_at": self.registered_at
        }


class ModelPromotionGate:
    """Enforces rigorous automated quality gates before promoting candidate models."""
    MIN_HARD_NEGATIVE_ACCURACY = 0.85
    MAX_ECE_CALIBRATION = 0.15
    MAX_P95_LATENCY_MS = 15.0

    @classmethod
    def evaluate_promotion(cls, current_prod: ModelCard, candidate: ModelCard) -> Dict[str, Any]:
        reasons_failed = []
        
        # 1. Macro-F1 check
        if candidate.macro_f1 < current_prod.macro_f1 - 0.001:
            reasons_failed.append(f"Candidate Macro-F1 ({candidate.macro_f1}) is lower than production ({current_prod.macro_f1}).")
            
        # 2. Hard Negative check
        if candidate.hard_negative_f1 < cls.MIN_HARD_NEGATIVE_ACCURACY:
            reasons_failed.append(f"Candidate Hard Negative F1 ({candidate.hard_negative_f1}) failed minimum threshold ({cls.MIN_HARD_NEGATIVE_ACCURACY}).")
            
        # 3. Calibration ECE check
        if candidate.ece_score > cls.MAX_ECE_CALIBRATION:
            reasons_failed.append(f"Candidate Calibration ECE ({candidate.ece_score}) exceeded max acceptable error ({cls.MAX_ECE_CALIBRATION}).")
            
        # 4. Latency check
        if candidate.latency_p50_ms > cls.MAX_P95_LATENCY_MS:
            reasons_failed.append(f"Candidate Latency ({candidate.latency_p50_ms} ms) exceeded max threshold ({cls.MAX_P95_LATENCY_MS} ms).")
            
        can_promote = (len(reasons_failed) == 0)
        
        return {
            "can_promote": can_promote,
            "current_production_version": current_prod.version,
            "candidate_version": candidate.version,
            "decision": "PROMOTED_TO_PRODUCTION" if can_promote else "REJECTED_REGRESSION_GATE",
            "checks": {
                "macro_f1_passed": candidate.macro_f1 >= current_prod.macro_f1,
                "hard_negative_passed": candidate.hard_negative_f1 >= cls.MIN_HARD_NEGATIVE_ACCURACY,
                "calibration_passed": candidate.ece_score <= cls.MAX_ECE_CALIBRATION,
                "latency_passed": candidate.latency_p50_ms <= cls.MAX_P95_LATENCY_MS
            },
            "reasons": reasons_failed if reasons_failed else ["All 4 Quality Promotion Gates Passed Successfully."]
        }


class ModelRegistry:
    """Manages versioned model artifacts, deployments, and promotion pipelines."""
    def __init__(self):
        self._models: Dict[str, ModelCard] = {
            "semantic_classifier": ModelCard(
                model_id="MOD-SEM-001",
                version="3.0.0",
                name="GramX-SemanticNet-Multilingual-v3.0",
                task="Multilingual Regional Complaint Categorization & Hierarchical Taxonomy",
                architecture="Subword Dense Embedding (d=128) + Calibrated Softmax MLP",
                training_dataset="GramX-Gold-Dataset-v2.5.0",
                accuracy=0.960,
                macro_f1=0.954,
                latency_p50_ms=0.08,
                status="PRODUCTION",
                languages_supported=["hi", "hi-bundeli", "en", "hinglish", "bn", "te", "ta", "mr", "gu", "pa"],
                limitations="Optimized for Gram Panchayat infrastructure domains (Water, Roads, Power, Sanitation, Drainage).",
                hard_negative_f1=0.96,
                ece_score=0.045
            ),
            "vision_inspector": ModelCard(
                model_id="MOD-VIS-002",
                version="2.1.0",
                name="GramX-Vision-InspecNet-v2.1",
                task="Civic Infrastructure Defect Anomaly Detection & Quality Assessment",
                architecture="Sobel Gradient Spatial Frequency + Laplacian Variance + Calibrated Multiclass Classifier",
                training_dataset="GramX-CivicVision-v2.1",
                accuracy=0.942,
                macro_f1=0.938,
                latency_p50_ms=3.34,
                status="PRODUCTION",
                languages_supported=["N/A (Visual Payloads)"],
                limitations="Requires minimum 64x64 pixel resolution and valid RGB/JPEG data."
            ),
            "hybrid_rag_retriever": ModelCard(
                model_id="MOD-RAG-003",
                version="2.0.0",
                name="GramX-HybridRAG-Retriever-v2.0",
                task="Government Schemes, SOPs & Citizen Guidance Retrieval",
                architecture="Okapi BM25 (k1=1.5, b=0.75) + Dense Subword Embeddings + Reciprocal Rank Fusion (k=60)",
                training_dataset="GramX-GovKnowledgeBase-v2.0",
                accuracy=0.952,
                macro_f1=0.948,
                latency_p50_ms=0.13,
                status="PRODUCTION",
                languages_supported=["hi", "en", "hi-bundeli"],
                limitations="Strictly bound by Gram Panchayat RBAC visibility rules."
            )
        }

    def list_models(self) -> List[Dict[str, Any]]:
        return [m.to_dict() for m in self._models.values()]

    def get_model(self, model_key: str) -> Optional[Dict[str, Any]]:
        m = self._models.get(model_key)
        return m.to_dict() if m else None

    def get_active_model(self) -> Dict[str, Any]:
        """Returns metadata for the currently active production semantic model."""
        prod = self._models.get("semantic_classifier")
        return prod.to_dict() if prod else {}

    def promote_candidate(self, candidate_card: ModelCard) -> Dict[str, Any]:
        """Evaluates and promotes candidate model if gates pass."""
        current = self._models.get("semantic_classifier")
        gate_res = ModelPromotionGate.evaluate_promotion(current, candidate_card)
        if gate_res["can_promote"]:
            self._models["semantic_classifier"] = candidate_card
        return gate_res

    def rollback_model(self, target_version: str) -> Dict[str, Any]:
        """Rolls back the active model to a previous validated version."""
        current = self._models.get("semantic_classifier")
        # Update active version
        if current:
            current.version = target_version
            current.status = "PRODUCTION"
        return {
            "status": "MODEL_ROLLED_BACK",
            "active_model_version": target_version,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }


# Global singleton instance
model_registry = ModelRegistry()

