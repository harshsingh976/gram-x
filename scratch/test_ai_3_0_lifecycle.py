"""
GRAM-X AI 3.0: COMPLETE PRODUCTION MACHINE LEARNING LIFECYCLE SUITE
===================================================================
Verifies the complete self-improving AI lifecycle:
1. Audit & Baseline Model Comparison (Rule vs TF-IDF vs Production)
2. Data Quality Engine & Dataset Certification
3. Leakage-Free Stratified Group Splitting
4. Real Mathematical Model Training & Loss Convergence
5. Multilingual Representation & Inference (Hindi, Bundeli, English, Hinglish)
6. Hard Negative Boundary Disambiguation
7. Expected Calibration Error (ECE) & Uncertainty Abstention
8. Strict Model Promotion Gate & Regression Protection
9. Continuous Feedback Quality Control, Drift Monitoring & Controlled Retraining
10. End-to-End Request Traceability & Performance Latency Profiles
"""

import sys
import os
import json
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath("backend"))

from app.services.ai_dataset import dataset_manager, data_quality_engine, GOLD_COMPLAINT_DATASET
from app.services.ai_classifier import semantic_classifier, TAXONOMY
from app.services.ai_baseline import ai_baseline_evaluator
from app.services.ai_calibration import calibration_engine
from app.services.ai_registry import model_registry, ModelCard, ModelPromotionGate
from app.services.ai_feedback import feedback_engine
from app.services.ai_benchmark import ai_benchmark
from app.services.ai_orchestrator import ai_orchestrator

def run_ai_3_0_suite():
    print("======================================================================")
    print("GRAM-X AI 3.0: COMPLETE PRODUCTION MACHINE LEARNING LIFECYCLE SUITE")
    print("======================================================================")

    # 1. Baseline Model Comparison
    print("\n[LIFECYCLE STEP 1] Audit & Comparative Baseline Evaluation...")
    baseline_res = ai_baseline_evaluator.evaluate_all()
    baselines = baseline_res["baselines"]
    rule_f1 = baselines["rule_heuristic_baseline"]["metrics"]["macro_f1"]
    tfidf_f1 = baselines["tfidf_linear_baseline"]["metrics"]["macro_f1"]
    prod_f1 = baselines["gramx_semantic_production_model"]["metrics"]["macro_f1"]
    
    assert prod_f1 > rule_f1, f"Production model ({prod_f1}) must outperform rule baseline ({rule_f1})"
    assert prod_f1 > tfidf_f1, f"Production model ({prod_f1}) must outperform TF-IDF baseline ({tfidf_f1})"
    print(f"  [PASS] Comparative Baseline Performance:")
    print(f"    - Rule Heuristic Baseline: Macro-F1 = {rule_f1} | Latency = {baselines['rule_heuristic_baseline']['metrics']['latency_p50_ms']} ms")
    print(f"    - TF-IDF Linear Baseline:  Macro-F1 = {tfidf_f1} | Latency = {baselines['tfidf_linear_baseline']['metrics']['latency_p50_ms']} ms")
    print(f"    - Production Semantic Net: Macro-F1 = {prod_f1} | Latency = {baselines['gramx_semantic_production_model']['metrics']['latency_p50_ms']} ms (WINNER)")

    # 2. Data Quality Engine
    print("\n[LIFECYCLE STEP 2] Pre-Training Data Quality Audit & Dataset Certification...")
    quality_res = data_quality_engine.audit_dataset(GOLD_COMPLAINT_DATASET)
    assert quality_res["is_clean"] is True
    assert quality_res["duplicate_count"] == 0
    assert quality_res["invalid_category_count"] == 0
    assert quality_res["empty_transcript_count"] == 0
    assert quality_res["imbalance_ratio"] <= 1.5
    print(f"  [PASS] Data Quality Status: {quality_res['quality_status']} ({quality_res['total_records_checked']} samples verified, Imbalance Ratio = {quality_res['imbalance_ratio']})")

    # 3. Leakage-Free Stratified Splitting
    print("\n[LIFECYCLE STEP 3] Leakage-Free Stratified Train / Val / Test Partitioning...")
    train_set, val_set, test_set = dataset_manager.stratified_split()
    train_ids = set(d["id"] for d in train_set)
    val_ids = set(d["id"] for d in val_set)
    test_ids = set(d["id"] for d in test_set)
    assert train_ids.isdisjoint(val_ids)
    assert train_ids.isdisjoint(test_ids)
    assert val_ids.isdisjoint(test_ids)
    print(f"  [PASS] Partition Counts: {len(train_set)} train / {len(val_set)} val / {len(test_set)} test (Zero Contamination)")

    # 4. Genuine Model Training & Convergence
    print("\n[LIFECYCLE STEP 4] Genuine Mathematical Model Training & Checkpointing...")
    train_res = semantic_classifier.train_on_dataset(train_set, val_set, epochs=50, learning_rate=0.80)
    assert train_res["status"] == "TRAINED_AND_VALIDATED"
    meta = train_res["metadata"]
    assert meta["final_train_loss"] < 1.2
    assert meta["final_val_accuracy"] >= 0.80
    print(f"  [PASS] Model Trained & Checkpointed | Final Loss: {meta['final_train_loss']} | Val Accuracy: {meta['final_val_accuracy'] * 100:.1f}%")

    # 5. Multilingual Semantic Inference across Domains
    print("\n[LIFECYCLE STEP 5] Multilingual Regional Voice & Text Inference...")
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
        assert pred["category"] == expected_cat
        print(f"  [PASS] {lang_label:14} -> Cat: {pred['category']:12} | Conf: {pred['confidence'] * 100:.1f}% | Tier: {pred['calibration_status']}")

    # 6. Hard Negative Boundary Disambiguation
    print("\n[LIFECYCLE STEP 6] Hard Negative Boundary Disambiguation Benchmark...")
    hn_res = ai_benchmark.evaluate_hard_negatives()
    assert hn_res["status"] == "PASS"
    assert hn_res["accuracy"] >= 0.85
    print(f"  [PASS] Hard Negatives Evaluated: {hn_res['hard_negatives_evaluated']} boundary cases | Accuracy: {hn_res['accuracy'] * 100:.1f}% | Macro-F1: {hn_res['macro_f1']}")

    # 7. Model Calibration & Uncertainty Abstention
    print("\n[LIFECYCLE STEP 7] Model Calibration (ECE) & Uncertainty Abstention...")
    test_confs = []
    test_accs = []
    for d in test_set:
        p = semantic_classifier.predict(d["text"])
        test_confs.append(p["confidence"])
        test_accs.append(p["category"] == d["category"])
    ece = calibration_engine.calculate_ece(test_confs, test_accs)
    assert ece <= 0.15
    # High confidence test
    high_dec = calibration_engine.evaluate_abstention(0.92, "water")
    assert high_dec["abstain"] is False
    assert high_dec["decision"] == "AUTOMATIC_DISPATCH"
    # Low confidence test (must abstain)
    low_dec = calibration_engine.evaluate_abstention(0.32, "unknown")
    assert low_dec["abstain"] is True
    assert low_dec["decision"] == "MODEL_ABSTENTION"
    print(f"  [PASS] Model Calibration ECE Score: {ece} | High Conf: {high_dec['decision']} | Low Conf Abstention: {low_dec['decision']} (Flagged to Manual Review)")

    # 8. Strict Model Promotion Gate
    print("\n[LIFECYCLE STEP 8] Strict Model Promotion Gate & Regression Protection...")
    current_prod = model_registry._models["semantic_classifier"]
    
    # Test A: Superior candidate (Approved)
    superior_cand = ModelCard(
        model_id="MOD-SEM-CAND-001",
        version="3.1.0",
        name="GramX-SemanticNet-Superior-Candidate",
        task="Multilingual Regional Categorization",
        architecture="Subword Dense Embedding (d=128) + Calibrated Softmax MLP",
        training_dataset="GramX-Gold-v2.5.1",
        accuracy=0.980,
        macro_f1=0.975,
        latency_p50_ms=0.08,
        status="CANDIDATE",
        hard_negative_f1=0.98,
        ece_score=0.035
    )
    approved_gate = ModelPromotionGate.evaluate_promotion(current_prod, superior_cand)
    assert approved_gate["can_promote"] is True
    assert approved_gate["decision"] == "PROMOTED_TO_PRODUCTION"
    
    # Test B: Inferior candidate with regression (Rejected)
    inferior_cand = ModelCard(
        model_id="MOD-SEM-CAND-002",
        version="3.0.1-bad",
        name="GramX-SemanticNet-Regressed-Candidate",
        task="Multilingual Regional Categorization",
        architecture="Subword Dense Embedding",
        training_dataset="GramX-Gold-v2.5.1",
        accuracy=0.750,
        macro_f1=0.720,
        latency_p50_ms=0.08,
        status="CANDIDATE",
        hard_negative_f1=0.65,
        ece_score=0.25
    )
    rejected_gate = ModelPromotionGate.evaluate_promotion(current_prod, inferior_cand)
    assert rejected_gate["can_promote"] is False
    assert rejected_gate["decision"] == "REJECTED_REGRESSION_GATE"
    print(f"  [PASS] Promotion Gate Verified | Superior Candidate: {approved_gate['decision']} | Inferior Candidate: {rejected_gate['decision']}")

    # 9. Continuous Feedback Quality Control & Drift Monitoring
    print("\n[LIFECYCLE STEP 9] Feedback Quality Control & Drift-Triggered Retraining...")
    # Reject invalid category
    bad_fb = feedback_engine.record_human_correction(
        complaint_id="COMP-ERR",
        text="invalid",
        original_predicted_category="water",
        corrected_category="space_exploration",
        reviewer_id=1,
        reason="Invalid test"
    )
    assert bad_fb["status"] == "REJECTED_INVALID_CATEGORY"
    
    # Accept valid category
    good_fb = feedback_engine.record_human_correction(
        complaint_id="COMP-901",
        text="नाली का पानी सड़क पर भर रहा है तुरंत निकासी चाहिए",
        original_predicted_category="water",
        corrected_category="drainage",
        reviewer_id=1,
        reason="Overflow caused by blocked stormwater drain"
    )
    assert good_fb["status"] == "FEEDBACK_LOGGED"
    
    # Check drift metrics
    drift_res = feedback_engine.drift_monitor.calculate_drift_metrics()
    assert "category_psi_score" in drift_res
    
    # Run controlled retraining
    retrain_res = feedback_engine.execute_controlled_retraining()
    assert retrain_res["status"] == "RETRAINING_COMPLETED"
    print(f"  [PASS] Feedback Quality Control Active | Invalid Blocked: True | Valid Feedback Recorded: True | Retraining: {retrain_res['status']}")

    # 10. End-to-End Request Traceability & Performance Latency
    print("\n[LIFECYCLE STEP 10] End-to-End Orchestration & Traceability Profile...")
    route_res = ai_orchestrator.route_inference("multilingual_voice", "हमारो पानी को हैंड़पंप पिपर्ली रोड पै टूट गयो है")
    assert route_res["status"] == "success"
    assert "request_id" in route_res
    assert "model_id" in route_res
    assert "latency_ms" in route_res
    voice_payload = route_res["data"]
    assert voice_payload["category"] == "water"
    assert "calibration_decision" in voice_payload
    print(f"  [PASS] Request Trace: ID={route_res['request_id']} | Model={route_res['model_id']} | Latency={route_res['latency_ms']} ms | Decision={voice_payload['calibration_decision']}")

    print("\n======================================================================")
    print("ALL 10 AI 3.0 LIFECYCLE TESTS PASSED — SELF-IMPROVING PRODUCTION AI")
    print("======================================================================")

if __name__ == "__main__":
    run_ai_3_0_suite()
