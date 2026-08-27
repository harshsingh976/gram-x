"""
GRAM-X AI 4.0: Explainable AI (XAI) & Counterfactual Feature Attribution Engine
Module: ai_explainability.py
"""

import time
from typing import Dict, Any, List, Tuple
from app.services.ai_classifier import semantic_classifier

class ExplainabilityEngine:
    """Computes token perturbation attribution scores and counterfactual feature analysis."""
    
    @classmethod
    def explain_prediction(cls, text: str) -> Dict[str, Any]:
        start_time = time.time()
        
        base_pred = semantic_classifier.predict(text)
        base_cat = base_pred["category"]
        base_conf = base_pred["confidence"]
        
        words = text.split()
        attributions: List[Dict[str, Any]] = []
        
        # Perturbation: Mask each token and measure drop in confidence
        for idx, w in enumerate(words):
            masked_words = [w_prime for j, w_prime in enumerate(words) if j != idx]
            masked_text = " ".join(masked_words)
            if not masked_text.strip():
                continue
                
            masked_pred = semantic_classifier.predict(masked_text)
            
            # Confidence drop for original category
            masked_prob = masked_pred["probabilities"].get(base_cat, 0.0)
            delta = base_conf - masked_prob
            
            if delta > 0.01:
                attributions.append({
                    "token": w,
                    "attribution_weight": round(delta, 4),
                    "impact": "POSITIVE_EVIDENCE"
                })
                
        # Sort descending by attribution weight
        attributions.sort(key=lambda x: x["attribution_weight"], reverse=True)
        top_tokens = attributions[:4]
        
        # Counterfactual Analysis: Mask top 2 tokens
        if top_tokens:
            top_words_set = set(t["token"] for t in top_tokens[:2])
            cf_text = " ".join([w for w in words if w not in top_words_set])
            cf_pred = semantic_classifier.predict(cf_text)
            counterfactual = {
                "scenario": f"Masking key domain tokens: {', '.join(top_words_set)}",
                "counterfactual_prediction": cf_pred["category"],
                "counterfactual_confidence": cf_pred["confidence"],
                "confidence_drop": round(base_conf - cf_pred["confidence"], 3)
            }
        else:
            counterfactual = {
                "scenario": "No strong dominant single tokens; robust distributed semantic embedding.",
                "counterfactual_prediction": base_cat,
                "counterfactual_confidence": base_conf,
                "confidence_drop": 0.0
            }

        elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
        
        return {
            "input_text": text,
            "predicted_category": base_cat,
            "predicted_confidence": base_conf,
            "calibration_status": base_pred["calibration_status"],
            "top_contributing_tokens": top_tokens,
            "counterfactual_analysis": counterfactual,
            "explanation_summary": f"Categorization as '{base_cat.upper()}' was primarily driven by semantic cues in: {[t['token'] for t in top_tokens]}.",
            "xai_latency_ms": elapsed_ms
        }


# Global singleton instance
explainability_engine = ExplainabilityEngine()
