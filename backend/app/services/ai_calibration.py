"""
GRAM-X AI 3.0: Model Calibration & Uncertainty Abstention Engine
Module: ai_calibration.py
"""

import math
from typing import Dict, Any, List, Tuple
import numpy as np

class CalibrationEngine:
    """Calculates calibration curves, Expected Calibration Error (ECE), and enforces uncertainty abstention."""
    def __init__(self, num_bins: int = 10):
        self.num_bins = num_bins

    def calculate_ece(self, confidences: List[float], accuracies: List[bool]) -> float:
        """
        Calculates Expected Calibration Error (ECE) across M confidence bins.
        ECE = sum_m ( |B_m| / N ) * | acc(B_m) - conf(B_m) |
        """
        n = len(confidences)
        if n == 0:
            return 0.0
            
        bins = np.linspace(0.0, 1.0, self.num_bins + 1)
        ece = 0.0
        
        for i in range(self.num_bins):
            bin_lower = bins[i]
            bin_upper = bins[i + 1]
            
            # Find items in bin
            in_bin_idx = [
                idx for idx, conf in enumerate(confidences)
                if (bin_lower <= conf < bin_upper) or (i == self.num_bins - 1 and conf == 1.0)
            ]
            
            bin_size = len(in_bin_idx)
            if bin_size > 0:
                bin_acc = sum(1 for idx in in_bin_idx if accuracies[idx]) / bin_size
                bin_conf = sum(confidences[idx] for idx in in_bin_idx) / bin_size
                ece += (bin_size / n) * abs(bin_acc - bin_conf)
                
        return round(float(ece), 4)

    def evaluate_abstention(self, confidence: float, category: str) -> Dict[str, Any]:
        """
        Applies decision thresholds and flags low-confidence predictions for abstention.
        """
        if confidence >= 0.70:
            return {
                "decision": "AUTOMATIC_DISPATCH",
                "abstain": False,
                "confidence_tier": "HIGH_CONFIDENCE",
                "assigned_category": category,
                "workflow": "Direct field worker dispatch / SLA activation"
            }
        elif confidence >= 0.45:
            return {
                "decision": "SECONDARY_VALIDATION_DISPATCH",
                "abstain": False,
                "confidence_tier": "MEDIUM_CONFIDENCE",
                "assigned_category": category,
                "workflow": "Standard dispatch with supervisor review checkpoint"
            }
        else:
            return {
                "decision": "MODEL_ABSTENTION",
                "abstain": True,
                "confidence_tier": "LOW_CONFIDENCE_ABSTAIN",
                "assigned_category": "unassigned_manual_review",
                "workflow": "Model abstained due to uncertainty. Routed to Panchayat Secretary desk for manual review."
            }


# Global singleton instance
calibration_engine = CalibrationEngine()
