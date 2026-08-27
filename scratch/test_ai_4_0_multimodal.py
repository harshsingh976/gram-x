"""
GRAM-X AI 4.0: MULTIMODAL CONTEXTUAL INTELLIGENCE & REASONING SUITE
==================================================================
Verifies:
1. Multimodal Contextual Fusion (Voice ASR + Text + Metadata + Prior)
2. Multilingual Semantic Duplicate Detection across Languages
3. Spatiotemporal Semantic Graph Clustering (DBSCAN / Haversine)
4. Canonical Query Rewriting & Hybrid Knowledge Grounded Reasoning
5. Explainable AI (XAI) Token Perturbation Attribution & Counterfactuals
6. Multi-Model Weighted Ensemble & Disagreement Resolution
"""

import sys
import os
import datetime

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath("backend"))

from app.services.ai_multimodal_fusion import multimodal_fusion_engine
from app.services.ai_spatiotemporal import spatiotemporal_engine, haversine_distance_km
from app.services.ai_grounded_reasoning import grounded_reasoning_engine
from app.services.ai_explainability import explainability_engine
from app.services.ai_ensemble import ensemble_engine

def run_ai_4_0_suite():
    print("======================================================================")
    print("GRAM-X AI 4.0: MULTIMODAL CONTEXTUAL INTELLIGENCE & REASONING SUITE")
    print("======================================================================")

    # 1. Multimodal Contextual Fusion
    print("\n[TEST 1] Multimodal Contextual Fusion (Voice ASR + Text + Meta + Location)...")
    # High-quality voice report
    fuse_res_high = multimodal_fusion_engine.fuse_complaint_modalities(
        text="हमारो पानी को हैंड़पंप पिपर्ली रोड पै टूट गयो है",
        asr_confidence=0.96,
        audio_duration_sec=5.2,
        village_name="Piparli",
        latitude=23.2851,
        longitude=77.4515,
        reported_severity="high",
        past_village_complaints_count=4
    )
    assert fuse_res_high["fused_category"] == "water"
    assert fuse_res_high["fused_confidence"] >= 0.70
    assert fuse_res_high["calibration_decision"] == "AUTOMATIC_DISPATCH"
    print(f"  [PASS] High-Quality Voice Fusion -> Cat: {fuse_res_high['fused_category']} | Conf: {fuse_res_high['fused_confidence'] * 100:.1f}% | Decision: {fuse_res_high['calibration_decision']}")

    # Low-quality noisy voice report (Acoustic penalty)
    fuse_res_low = multimodal_fusion_engine.fuse_complaint_modalities(
        text="हमारो पानी को हैंड़पंप टूट गयो",
        asr_confidence=0.35, # Noisy / low ASR confidence
        audio_duration_sec=0.8, # Truncated
        reported_severity="low"
    )
    assert fuse_res_low["fused_confidence"] < fuse_res_high["fused_confidence"]
    print(f"  [PASS] Noisy/Low ASR Penalty Applied -> Fused Conf dropped to: {fuse_res_low['fused_confidence'] * 100:.1f}% (Acoustic Quality Awareness)")

    # 2. Multilingual Semantic Duplicate Detection
    print("\n[TEST 2] Multilingual Semantic Duplicate Detection (Hindi vs English vs Bundeli)...")
    mock_incidents = [
        {
            "id": 101,
            "title": "Drinking water supply halted in Ward 4 due to pump failure",
            "description": "Resident reported motor burn out and tap dry",
            "category": "water",
            "latitude": 23.2855,
            "longitude": 77.4520,
            "created_at": (datetime.datetime.utcnow() - datetime.timedelta(hours=6)).isoformat(),
            "status": "in_progress"
        },
        {
            "id": 102,
            "title": "Road pothole near village entrance",
            "description": "Deep asphalt crater on road",
            "category": "roads",
            "latitude": 23.2900,
            "longitude": 77.4600,
            "created_at": (datetime.datetime.utcnow() - datetime.timedelta(hours=12)).isoformat(),
            "status": "reported"
        }
    ]
    # Query in Hindi for water issue
    dup_res = spatiotemporal_engine.find_semantic_duplicates(
        query_text="हमारे मोहल्ले में पानी की सप्लाई बंद है नल में पानी नहीं आ रहा",
        query_lat=23.2851,
        query_lon=77.4515,
        query_time=datetime.datetime.utcnow(),
        existing_incidents=mock_incidents,
        similarity_threshold=0.60
    )
    assert len(dup_res) >= 1
    top_dup = dup_res[0]
    assert top_dup["incident_id"] == 101
    assert top_dup["category"] == "water"
    assert top_dup["spatial_distance_km"] < 1.0
    print(f"  [PASS] Cross-Language Duplicate Matched: Incident #{top_dup['incident_id']} ('{top_dup['title']}') | Sim: {top_dup['semantic_similarity']} | Dist: {top_dup['spatial_distance_km']} km")

    # 3. Spatiotemporal Semantic Graph Clustering
    print("\n[TEST 3] Spatiotemporal Graph Clustering (Semantic + Haversine Metric)...")
    cluster_candidates = [
        {"id": 201, "title": "Pothole on Piparli Main Road", "description": "Vehicle axle damage risk", "category": "roads", "latitude": 23.2851, "longitude": 77.4515},
        {"id": 202, "title": "पिपर्ली सड़क पर गहरा गड्ढा हो गया है", "description": "सड़क पूरी तरह उखड़ गई", "category": "roads", "latitude": 23.2860, "longitude": 77.4525},
        {"id": 203, "title": "Transformer oil leakage", "description": "Sparks from transformer", "category": "electricity", "latitude": 23.3100, "longitude": 77.4900}
    ]
    clusters = spatiotemporal_engine.cluster_spatiotemporal_incidents(cluster_candidates)
    assert len(clusters) >= 1
    top_clust = clusters[0]
    assert top_clust["category"] == "roads"
    assert top_clust["incident_count"] == 2
    print(f"  [PASS] Cluster Formed: ID={top_clust['cluster_id']} | Category={top_clust['category']} | Incidents={top_clust['incident_ids']} | Center={top_clust['center_coordinates']}")

    # 4. Canonical Query Rewriting & Hybrid Knowledge Grounded Reasoning
    print("\n[TEST 4] Canonical Query Rewriting & Policy-Grounded Reasoning...")
    reason_res = grounded_reasoning_engine.reason_and_ground(
        complaint_text="हमारो पानी को हैंड़पंप पिपर्ली रोड पै टूट गयो है",
        category="water",
        user_role="district"
    )
    assert reason_res["status"] == "SUCCESS"
    assert reason_res["is_authoritative_grounded"] is True
    assert "Jal Jeevan Mission" in reason_res["top_policy_citation"]
    assert reason_res["statutory_sla_hours"] == 24
    print(f"  [PASS] Grounded Policy Citation: '{reason_res['top_policy_citation']}' | Department: {reason_res['governing_department']} | Statutory SLA: {reason_res['statutory_sla_hours']}h")
    print(f"    Explanation: {reason_res['grounded_explanation']}")

    # 5. Explainable AI (XAI) Token Perturbation & Counterfactuals
    print("\n[TEST 5] Explainable AI (XAI) Token Attribution & Counterfactuals...")
    xai_res = explainability_engine.explain_prediction("वार्ड 2 में मुख्य सड़क पर बड़ा गड्ढा हो गया है तुरंत मरम्मत चाहिए")
    assert xai_res["predicted_category"] == "roads"
    assert len(xai_res["top_contributing_tokens"]) > 0
    cf = xai_res["counterfactual_analysis"]
    print(f"  [PASS] XAI Primary Driver Tokens: {[t['token'] for t in xai_res['top_contributing_tokens']]}")
    print(f"    Counterfactual Scenario: {cf['scenario']} -> Pred: {cf['counterfactual_prediction']} (Conf Drop: {cf['confidence_drop']})")

    # 6. Multi-Model Calibrated Ensemble & Disagreement Resolution
    print("\n[TEST 6] Multi-Model Weighted Ensemble & Disagreement Resolution...")
    ens_res = ensemble_engine.predict_ensemble("सार्वजनिक चौपाल के पास कचरे का बड़ा ढेर लगा हुआ है तुरंत सफाई करवाएं")
    assert ens_res["ensemble_category"] == "sanitation"
    assert ens_res["consensus_status"] == "CONSENSUS_AUTHORITATIVE"
    print(f"  [PASS] Ensemble Decision: Cat={ens_res['ensemble_category']} | Conf={ens_res['ensemble_confidence'] * 100:.1f}% | Consensus: {ens_res['consensus_status']} ({ens_res['resolution_summary']})")

    print("\n======================================================================")
    print("ALL 6 AI 4.0 MULTIMODAL INTELLIGENCE TESTS PASSED — DEEP CONTEXTUAL REASONING")
    print("======================================================================")

if __name__ == "__main__":
    run_ai_4_0_suite()
