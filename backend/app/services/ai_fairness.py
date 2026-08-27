import time
from typing import Dict, Any, List
from app.services.ai_voice import transcribe_voice_report

SUPPORTED_LANGUAGES = [
    "hi", "bho_bundeli", "en", "bn", "te", "mr", "ta", "gu", "kn", "ml", "or", "pa", "as"
]

LANGUAGE_BENCHMARK_PROMPTS = {
    "hi": [("पानी की पाइपलाइन टूट गई है", "water"), ("सड़क पर बड़ा गड्ढा है", "roads"), ("बिजली का खंभा झुक गया है", "electricity")],
    "bho_bundeli": [("हमारो हैंडपंप पानी नई देत", "water"), ("सड़किया में गड्ढा हो गयो", "roads"), ("रात से बिजली नई आ रही", "electricity")],
    "en": [("Water supply pump has failed", "water"), ("Potholes on main village road", "roads"), ("Streetlight is not working", "electricity")],
    "bn": [("পানের জল আসছে না", "water"), ("রাস্তা खराब हो गया", "roads"), ("বিদ্যুৎ সংযোগ বিচ্ছিন্ন", "electricity")],
    "te": [("మంచి నీటి పైపు పగిలిపోయింది", "water"), ("రోడ్డు खराब", "roads"), ("కరెంట్ సరఫరా నిలిచిపోయింది", "electricity")]
}

class MultilingualFairnessAuditor:
    """Evaluates per-language accuracy, disparate impact ratio, and enforces Fairness Release Gates."""

    @classmethod
    def audit_model_fairness(cls) -> Dict[str, Any]:
        """
        Evaluates classifier across all benchmark regional language sets.
        Computes Disparate Impact Ratio = min(Lang_Accuracy) / max(Lang_Accuracy).
        Gate Rule: Disparate Impact Ratio >= 0.80 and no language drops below 75% accuracy.
        """
        start_time = time.time()
        lang_metrics: Dict[str, Any] = {}

        for lang, samples in LANGUAGE_BENCHMARK_PROMPTS.items():
            correct = 0
            for text, target_cat in samples:
                res = transcribe_voice_report(text)
                if res["category"] == target_cat:
                    correct += 1
            
            acc = round(correct / len(samples), 3)
            lang_metrics[lang] = {
                "sample_count": len(samples),
                "accuracy": acc,
                "status": "FAIR" if acc >= 0.75 else "DISPARITY_FLAGGED"
            }

        accuracies = [m["accuracy"] for m in lang_metrics.values()]
        min_acc = min(accuracies)
        max_acc = max(accuracies)
        disparate_impact_ratio = round(min_acc / max(0.01, max_acc), 3)

        passed_fairness_gate = disparate_impact_ratio >= 0.80 and min_acc >= 0.75
        elapsed_ms = round((time.time() - start_time) * 1000.0, 2)

        return {
            "total_languages_evaluated": len(lang_metrics),
            "language_breakdown": lang_metrics,
            "min_language_accuracy": min_acc,
            "max_language_accuracy": max_acc,
            "disparate_impact_ratio": disparate_impact_ratio,
            "fairness_gate_passed": passed_fairness_gate,
            "fairness_status": "FAIRNESS_RELEASE_GATE_PASSED" if passed_fairness_gate else "FAIRNESS_REGRESSION_REJECTED",
            "audit_latency_ms": elapsed_ms
        }

fairness_auditor = MultilingualFairnessAuditor()
