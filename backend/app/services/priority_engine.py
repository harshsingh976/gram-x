import math
from app.config import WEIGHT_CRITICALITY, WEIGHT_SEVERITY, WEIGHT_POPULATION, WEIGHT_CONFIDENCE

def calculate_priority(
    category: str,
    severity: str,
    affected_population: int,
    estimated_cost: float,
    ai_confidence: float
) -> dict:
    """
    Computes a multi-factor priority score (0-100) for ranking interventions.
    
    Factors:
    - Service Criticality (Water=10, Drainage=8, Electricity=6, Roads=5, Waste=4)
    - Severity (Critical=10, High=7, Medium=4, Low=2)
    - Affected Population (logarithmic scaling: log10(pop) * 2.5, capped at 10)
    - Confidence of Evidence (ai_confidence * 10)
    - Estimated Cost (Impact-per-Rupee factor: lower cost increases priority slightly,
                      but critical items are heavily protected from cost down-ranking)
    """
    # 0. Input Validations
    if affected_population < 0:
        raise ValueError("Affected population cannot be negative")
    if ai_confidence < 0.0 or ai_confidence > 1.0:
        raise ValueError("AI confidence score must be between 0.0 and 1.0")
    if estimated_cost < 0.0:
        raise ValueError("Estimated cost cannot be negative")

    # 1. Service Criticality (Max 10)
    criticality_map = {
        "water": 10,
        "drainage": 8,
        "electricity": 6,
        "roads": 5,
        "waste": 4
    }
    criticality_score = criticality_map.get(category.lower(), 4)
    
    # 2. Severity Score (Max 10)
    severity_map = {
        "critical": 10,
        "high": 7,
        "medium": 4,
        "low": 2
    }
    severity_score = severity_map.get(severity.lower(), 4)
    
    # 3. Affected Population Score (Max 10)
    if affected_population == 0:
        pop_score = 0.0
    else:
        # 10 people = 2.5, 100 people = 5.0, 1000+ people = 7.5 to 10
        pop_score = min(10.0, math.log10(affected_population) * 2.5 + 1.0)
        
    # 4. Confidence Score (Max 10)
    confidence_score = ai_confidence * 10.0
    
    # 5. Base Benefit (Max 40)
    # Weighted sum using configurable weights
    total_weight = WEIGHT_CRITICALITY + WEIGHT_SEVERITY + WEIGHT_POPULATION + WEIGHT_CONFIDENCE
    if total_weight <= 0:
        total_weight = 1.0
        
    normalized_criticality = WEIGHT_CRITICALITY / total_weight
    normalized_severity = WEIGHT_SEVERITY / total_weight
    normalized_population = WEIGHT_POPULATION / total_weight
    normalized_confidence = WEIGHT_CONFIDENCE / total_weight

    base_benefit = (
        (criticality_score * normalized_criticality) +
        (severity_score * normalized_severity) +
        (pop_score * normalized_population) +
        (confidence_score * normalized_confidence)
    ) * 10.0 # scale to 100
    
    # 6. Impact-per-Rupee Cost Factor
    # We want to favor lower cost interventions but not at the expense of critical issues.
    # Cost factor is a multiplier between 0.8 and 1.2
    # If cost is very high (e.g. 500,000), it dampens score. If very low (e.g., 2000), it increases it.
    if estimated_cost <= 0:
        cost_multiplier = 1.0
    else:
        # Logarithmic scale for cost
        log_cost = math.log10(max(100.0, estimated_cost))
        # Log cost typically ranges from 2.0 (100) to 6.0 (1,000,000)
        # Shift to range: higher cost -> lower multiplier
        cost_multiplier = 1.3 - (log_cost / 15.0)
        cost_multiplier = max(0.7, min(1.3, cost_multiplier))
        
    # If severity is critical, do not penalize heavily for high cost
    if severity.lower() == "critical":
        cost_multiplier = max(1.0, cost_multiplier)
        
    final_score = base_benefit * cost_multiplier
    final_score = min(100.0, max(0.0, final_score))
    
    return {
        "score": round(final_score, 1),
        "breakdown": {
            "service_criticality": round(criticality_score, 1),
            "severity_level": round(severity_score, 1),
            "population_density": round(pop_score, 1),
            "evidence_confidence": round(confidence_score, 1),
            "cost_multiplier": round(cost_multiplier, 2),
            "base_benefit": round(base_benefit, 1)
        },
        "explanation": (
            f"This intervention targets a {category.upper()} issue affecting {affected_population} residents. "
            f"With a {severity.upper()} severity rating and {int(ai_confidence * 100)}% evidence confidence, "
            f"the base social benefit is scored at {round(base_benefit, 1)}/100. "
            f"Adjusted for an estimated cost of ₹{int(estimated_cost):,}, the final Impact-per-Rupee score is {round(final_score, 1)}/100."
        )
    }
