"""
GRAM-X AI 4.0: Multimodal Contextual Intelligence & Modality Fusion Engine
Module: ai_multimodal_fusion.py
"""

import time
import math
from typing import Dict, Any, List, Optional
import numpy as np

from app.services.ai_classifier import semantic_classifier, CATEGORIES, TAXONOMY
from app.services.ai_calibration import calibration_engine

class MultimodalFusionEngine:
    """
    Fuses Voice ASR signals, Semantic Text Vectors, Structured Metadata,
    Geospatial Coordinates, and Historical Temporal Context into a Unified State.
    """
    def __init__(self):
        self.modality_weights = {
            "semantic_text": 0.45,
            "asr_acoustic_quality": 0.20,
            "structured_metadata": 0.20,
            "spatiotemporal_context": 0.15
        }

    def fuse_complaint_modalities(
        self,
        text: str,
        asr_confidence: float = 0.95,
        audio_duration_sec: float = 4.5,
        village_id: Optional[int] = None,
        village_name: Optional[str] = "Piparli",
        latitude: Optional[float] = 23.2851,
        longitude: Optional[float] = 77.4515,
        reported_severity: Optional[str] = "medium",
        past_village_complaints_count: int = 0
    ) -> Dict[str, Any]:
        """
        Builds a unified multimodal complaint representation.
        Penalizes low ASR quality / noisy acoustic inputs gracefully.
        """
        start_time = time.time()
        
        # 1. Semantic Text Modality
        text_prediction = semantic_classifier.predict(text)
        base_cat = text_prediction["category"]
        raw_text_conf = text_prediction["confidence"]
        
        # 2. Voice Acoustic & ASR Quality Modality
        # Acoustic penalty: if ASR confidence is low (< 0.70) or duration < 1.0s, scale down
        acoustic_score = max(0.20, min(1.0, asr_confidence))
        if audio_duration_sec < 1.5:
            acoustic_score *= 0.85
            
        # 3. Structured Metadata Modality
        meta_score = 1.0
        if reported_severity == "critical":
            meta_score = 1.15
        elif reported_severity == "high":
            meta_score = 1.05
            
        # 4. Spatiotemporal & Historical Context Modality
        context_score = 1.0
        if past_village_complaints_count > 3:
            # Active localized recurrence strengthens contextual prior
            context_score = 1.10
            
        # 5. Multimodal Probability Fusion
        fused_conf = (
            (raw_text_conf * self.modality_weights["semantic_text"]) +
            (acoustic_score * raw_text_conf * self.modality_weights["asr_acoustic_quality"]) +
            (min(1.0, raw_text_conf * meta_score) * self.modality_weights["structured_metadata"]) +
            (min(1.0, raw_text_conf * context_score) * self.modality_weights["spatiotemporal_context"])
        )
        fused_conf = round(float(np.clip(fused_conf, 0.05, 0.99)), 4)
        
        # 6. Apply Model Calibration & Abstention on Fused State
        calib_decision = calibration_engine.evaluate_abstention(fused_conf, base_cat)
        
        elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
        
        tax_info = TAXONOMY.get(base_cat, TAXONOMY["water"])
        
        return {
            "fused_category": base_cat,
            "subcategory": tax_info["subcategory"],
            "issue_type": tax_info["issue_type"],
            "department": tax_info["department"],
            "fused_confidence": fused_conf,
            "calibration_decision": calib_decision["decision"],
            "abstain_flag": calib_decision["abstain"],
            "confidence_tier": calib_decision["confidence_tier"],
            "modality_signals": {
                "text_semantic_confidence": raw_text_conf,
                "asr_acoustic_score": round(acoustic_score, 3),
                "metadata_multiplier": round(meta_score, 2),
                "spatiotemporal_context_multiplier": round(context_score, 2)
            },
            "geospatial_context": {
                "village_id": village_id,
                "village_name": village_name,
                "coordinates": [latitude, longitude] if latitude and longitude else None
            },
            "fusion_latency_ms": elapsed_ms
        }


# Global singleton instance
multimodal_fusion_engine = MultimodalFusionEngine()
