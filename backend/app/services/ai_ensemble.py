"""
GRAM-X AI 4.0: Model Ensemble & Controlled Disagreement Resolution Engine
Module: ai_ensemble.py
"""

import time
from typing import Dict, Any, List, Optional
import numpy as np

from app.services.ai_classifier import semantic_classifier, CATEGORIES, CAT_TO_IDX, IDX_TO_CAT
from app.services.ai_baseline import ai_baseline_evaluator
from app.services.ai_calibration import calibration_engine

class EnsembleEngine:
    """Combines heterogeneous model architectures and resolves model disagreements."""
    def __init__(self):
        self.model_weights = {
            "semantic_classifier": 0.60,
            "tfidf_classifier": 0.25,
            "rule_verifier": 0.15
        }

    def predict_ensemble(self, text: str) -> Dict[str, Any]:
        start_time = time.time()
        
        # 1. Semantic Net prediction
        pred_sem = semantic_classifier.predict(text)
        
        # 2. TF-IDF prediction
        pred_tfidf = ai_baseline_evaluator.tfidf_baseline.predict(text)
        
        # 3. Rule prediction
        pred_rule = ai_baseline_evaluator.rule_baseline.predict(text)
        
        individual_predictions = {
            "semantic_net": pred_sem["category"],
            "tfidf_linear": pred_tfidf["category"],
            "rule_verifier": pred_rule["category"]
        }
        
        # Weighted voting
        category_scores = {c: 0.0 for c in CATEGORIES}
        
        category_scores[pred_sem["category"]] += self.model_weights["semantic_classifier"] * pred_sem["confidence"]
        category_scores[pred_tfidf["category"]] += self.model_weights["tfidf_classifier"] * pred_tfidf["confidence"]
        category_scores[pred_rule["category"]] += self.model_weights["rule_verifier"] * pred_rule["confidence"]
        
        # Find winning category
        best_cat = max(category_scores, key=category_scores.get)
        total_score = sum(category_scores.values())
        ensemble_conf = round(category_scores[best_cat] / max(1e-5, total_score), 4)
        
        # Check consensus
        votes = list(individual_predictions.values())
        matching_votes = votes.count(best_cat)
        consensus_ratio = matching_votes / len(votes)
        
        if consensus_ratio >= 0.66:
            consensus_status = "CONSENSUS_AUTHORITATIVE"
            resolution = f"Unanimous / Majority consensus ({matching_votes}/3 models agreed on {best_cat.upper()})."
        else:
            consensus_status = "DISAGREEMENT_SUPERVISOR_FLAGGED"
            resolution = f"Model disagreement detected ({votes}). Flagged for secondary supervisor verification."
            
        calib_decision = calibration_engine.evaluate_abstention(ensemble_conf, best_cat)
        elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
        
        return {
            "ensemble_category": best_cat,
            "ensemble_confidence": ensemble_conf,
            "consensus_status": consensus_status,
            "consensus_ratio": round(consensus_ratio, 2),
            "individual_votes": individual_predictions,
            "resolution_summary": resolution,
            "calibration_decision": calib_decision["decision"],
            "abstain_flag": calib_decision["abstain"],
            "latency_ms": elapsed_ms
        }


# Global singleton instance
ensemble_engine = EnsembleEngine()
