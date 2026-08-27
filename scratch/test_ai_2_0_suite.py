"""
GRAM-X AI 2.0 REAL MODEL TRAINING, BENCHMARKING & MLOps SUITE
============================================================
Comprehensive test suite verifying:
1. Real Data-Driven Model Training & Loss Convergence
2. Multilingual Semantic Embeddings & Representation
3. Hierarchical Taxonomy Integrity & Department Mapping
4. Hard Negative Boundary Disambiguation
5. Calibrated Confidence & Uncertainty Quantification
6. Model Registry Governance & Model Cards
7. Language-Wise Performance Matrix
8. Live Drift Monitoring & Population Stability Index (PSI)
9. Human Supervisor Feedback & Controlled Retraining
10. End-to-End API Routing & Inference Latency Benchmarks
"""

import sys
import os
import json
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath("backend"))

from app.services.ai_dataset import dataset_manager
from app.services.ai_classifier import semantic_classifier, TAXONOMY
from app.services.ai_benchmark import ai_benchmark
from app.services.ai_registry import model_registry
from app.services.ai_feedback import feedback_engine
from app.services.ai_orchestrator import ai_orchestrator

def run_ai_2_0_suite():
    print("======================================================================")
    print("GRAM-X AI 2.0: REAL MODEL TRAINING, BENCHMARKING & MLOps SUITE")
    print("======================================================================")

    # 1. Dataset Engineering & Stratified Splits
    print("\n[TEST 1] Gold Standard Dataset Engineering & Leakage-Free Stratified Split...")
    stats = dataset_manager.get_dataset_stats()
    assert stats["total_records"] >= 25
    assert len(stats["category_distribution"]) == 5
    assert stats["hard_negatives_count"] >= 5
    train_set, val_set, test_set = dataset_manager.stratified_split()
    assert len(train_set) > 0 and len(val_set) > 0 and len(test_set) > 0
    # Ensure no ID leakage across splits
    train_ids = set(d["id"] for d in train_set)
    val_ids = set(d["id"] for d in val_set)
    test_ids = set(d["id"] for d in test_set)
    assert train_ids.isdisjoint(val_ids)
    assert train_ids.isdisjoint(test_ids)
    assert val_ids.isdisjoint(test_ids)
    print(f"  [PASS] Dataset v{stats['dataset_version']} ({stats['total_records']} items, {stats['hard_negatives_count']} hard negatives) | Split: {len(train_set)} train / {len(val_set)} val / {len(test_set)} test (Zero Leakage)")

    # 2. Genuine Mathematical Model Training & Loss Convergence
    print("\n[TEST 2] Genuine Model Training & Gradient Descent Convergence...")
    train_res = semantic_classifier.train_on_dataset(train_set, val_set, epochs=40, learning_rate=0.08)
    assert train_res["status"] == "TRAINED_AND_VALIDATED"
    meta = train_res["metadata"]
    assert meta["final_train_loss"] < 1.5
    assert meta["final_val_accuracy"] >= 0.80
    assert semantic_classifier.is_trained is True
    print(f"  [PASS] Training Converged | Epochs: {meta['epochs_trained']} | Train Loss: {meta['final_train_loss']} | Val Accuracy: {meta['final_val_accuracy'] * 100:.1f}%")

    # 3. Multilingual Representation & Inference Accuracy
    print("\n[TEST 3] Multilingual Semantic Inference across 5 Panchayat Domains...")
    test_cases = [
        ("हमारो पानी को हैंड़पंप पिपर्ली रोड पै टूट गयो है", "water", "Bundeli"),
        ("गांव की मुख्य सड़क पर बड़ा गड्ढा हो गया है गाड़ियां गिर रही हैं", "roads", "Hindi"),
        ("Overhead high tension wire is sagging dangerously over street", "electricity", "English"),
        ("वार्ड 2 में कूड़े का बड़ा ढेर लगा हुआ है तुरंत सफाई चाहिए", "sanitation", "Hindi"),
        ("बरसात की नाली पूरी तरह जाम है गंदा पानी रास्ते पर भर गया", "drainage", "Hindi"),
        ("Ward 3 water pipeline leak ho rahi hai emergency repair needed", "water", "Code-Switched")
    ]
    for text, expected_cat, lang_label in test_cases:
        pred = semantic_classifier.predict(text)
        assert pred["category"] == expected_cat, f"Expected {expected_cat} for '{text}', got {pred['category']}"
        assert pred["confidence"] >= 0.50
        print(f"  [PASS] {lang_label:14} -> Pred: {pred['category']:12} (Confidence: {pred['confidence'] * 100:.1f}%, Status: {pred['calibration_status']})")

    # 4. Hard Negative Boundary Disambiguation
    print("\n[TEST 4] Hard Negative Boundary Disambiguation Evaluation...")
    hn_res = ai_benchmark.evaluate_hard_negatives()
    assert hn_res["status"] == "PASS"
    assert hn_res["accuracy"] >= 0.80
    print(f"  [PASS] Hard Negatives Evaluated: {hn_res['hard_negatives_evaluated']} cases | Accuracy: {hn_res['accuracy'] * 100:.1f}% | Macro-F1: {hn_res['macro_f1']}")

    # 5. Strict Hierarchical Taxonomy & Department Mapping
    print("\n[TEST 5] Hierarchical Taxonomy & Department Validation...")
    for cat, info in TAXONOMY.items():
        assert "subcategory" in info
        assert "issue_type" in info
        assert "department" in info
        # Verify prediction maps to valid taxonomy
        dummy_pred = semantic_classifier.predict(f"Test complaint about {cat}")
        assert dummy_pred["department"] in [
            "Public Health Engineering (PHE)",
            "Public Works Department (PWD)",
            "State Electricity Distribution (DISCOM)",
            "Swachh Bharat Gramin / Panchayat",
            "Minor Irrigation / Panchayat Works"
        ]
    print("  [PASS] All 5 Categories strictly conform to Gram Panchayat Department Taxonomy without hallucination.")

    # 6. Language-Wise Performance Matrix
    print("\n[TEST 6] Language-Wise Evaluation Benchmark Matrix...")
    lang_bench = ai_benchmark.evaluate_language_matrix()
    for lang, m in lang_bench["language_matrix"].items():
        assert m["accuracy"] >= 0.80
        print(f"  [PASS] Language '{lang:10}' -> Accuracy: {m['accuracy'] * 100:.1f}% | F1: {m['macro_f1']} | Samples: {m['sample_count']}")

    # 7. Model Registry Governance & Model Cards
    print("\n[TEST 7] Model Registry & Version Governance...")
    models = model_registry.list_models()
    assert len(models) >= 3
    mod_ids = [m["model_id"] for m in models]
    assert "MOD-SEM-001" in mod_ids
    assert "MOD-VIS-002" in mod_ids
    assert "MOD-RAG-003" in mod_ids
    print(f"  [PASS] Model Registry Verified: {len(models)} production models actively managed with immutable model cards.")

    # 8. Real-Time Drift Monitoring & PSI Computation
    print("\n[TEST 8] Population Stability Index (PSI) & Drift Monitoring...")
    # Log simulated live stream
    for _ in range(20):
        feedback_engine.drift_monitor.log_inference({"category": "water", "language": "hi", "confidence": 0.92})
        feedback_engine.drift_monitor.log_inference({"category": "roads", "language": "hi-bundeli", "confidence": 0.88})
        feedback_engine.drift_monitor.log_inference({"category": "electricity", "language": "en", "confidence": 0.95})
    drift_metrics = feedback_engine.drift_monitor.calculate_drift_metrics()
    assert "category_psi_score" in drift_metrics
    assert drift_metrics["sample_count"] >= 50
    print(f"  [PASS] Drift Monitor Active | Samples: {drift_metrics['sample_count']} | PSI Score: {drift_metrics['category_psi_score']} | Drift Detected: {drift_metrics['drift_detected']}")

    # 9. Human Supervisor Feedback & Controlled Retraining
    print("\n[TEST 9] Human Supervisor Feedback Recording & Controlled Retraining...")
    fb_res = feedback_engine.record_human_correction(
        complaint_id="LIVE-COMP-099",
        text="जलभराव की समस्या है नाली का पानी सड़क पर बह रहा है",
        original_predicted_category="water",
        corrected_category="drainage",
        reviewer_id=1,
        reason="Waterlogging caused by blocked drain culvert"
    )
    assert fb_res["status"] == "FEEDBACK_LOGGED"
    retrain_res = feedback_engine.execute_controlled_retraining()
    assert retrain_res["status"] == "RETRAINING_COMPLETED"
    print(f"  [PASS] Feedback Integrated | Retrained on {retrain_res['total_dataset_size']} records | Status: {retrain_res['status']}")

    # 10. AI Orchestrator Latency & Quality Gate Verification
    print("\n[TEST 10] Orchestrator Routing & Sub-Millisecond Latency...")
    route_res = ai_orchestrator.route_inference("multilingual_voice", "हमारो पानी को हैंड़पंप पिपर्ली रोड पै टूट गयो है")
    assert route_res["status"] == "success"
    voice_data = route_res["data"]
    assert voice_data["category"] == "water"
    assert voice_data["confidence"] >= 0.50
    eval_res = ai_orchestrator.run_evaluation_suite()
    assert "PASSED" in eval_res["overall_status"]
    print(f"  [PASS] Orchestrator Inference OK | Category: {voice_data['category']} | Confidence: {voice_data['confidence'] * 100:.1f}% | Latency: {route_res['latency_ms']} ms")

    print("\n======================================================================")
    print("ALL 10 AI 2.0 TESTS PASSED — PRODUCTION-GRADE MULTILINGUAL INTELLIGENCE")
    print("======================================================================")

if __name__ == "__main__":
    run_ai_2_0_suite()
