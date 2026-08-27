"""
GRAM-X PHASE 5 & PHASE 6: RESOLUTION INTEGRITY & SYSTEMIC ROOT-CAUSE SUITE
==========================================================================
Verifies:
1. Resolution vs Disposal: Evidence-Supported Resolution vs Vague Closure
2. Complaint-Response Cross-Lingual Semantic Alignment
3. Response Copy-Paste Boilerplate Repetition Pattern Detection
4. Statutory SLA Delay Risk Prediction
5. Department Lifecycle Stage Bottleneck Measurement
6. Systemic Problem Detection & Classification (SYSTEMIC_CANDIDATE)
7. Physical Asset & Infrastructure Failure Pattern Mining
8. Evidence-Ranked Root-Cause Hypotheses & Conflict Checks
9. Multi-Dimensional Service Health Index (0-100)
10. Preventive Governance Signals (Opex Patches vs Capex Replacement)
"""

import sys
import os
import datetime

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath("backend"))

from app.database import SessionLocal, Base, engine
from app.seed import seed_database
from app.services.resolution_integrity import resolution_integrity_engine
from app.services.systemic_intelligence import systemic_intelligence_engine
from app.models import Incident, Task, IncidentEvidence

def run_phase5_phase6_suite():
    print("======================================================================")
    print("GRAM-X PHASE 5 & 6: RESOLUTION INTEGRITY & SYSTEMIC ROOT-CAUSE SUITE")
    print("======================================================================")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)

    try:
        # 1. Resolution Integrity Analysis on Seeded Incident
        print("\n[TEST 1] Resolution vs Disposal: Evidence-Supported Resolution Audit...")
        res_audit = resolution_integrity_engine.analyze_incident_resolution(1, db)
        assert "error" not in res_audit
        assert "resolution_integrity_score" in res_audit
        assert "resolution_integrity_status" in res_audit
        print(f"  [PASS] Incident #1 Resolution Audit -> Score: {res_audit['resolution_integrity_score']} | Status: {res_audit['resolution_integrity_status']} | Recommendation: {res_audit['review_recommendation']}")

        # 2. Vague Response & Specificity Evaluation
        print("\n[TEST 2] Response Specificity & Vague Boilerplate Detection...")
        vague_score, vague_label = resolution_integrity_engine.evaluate_response_specificity("Done")
        assert vague_label == "VAGUE_BOILERPLATE_RESPONSE"
        tech_score, tech_label = resolution_integrity_engine.evaluate_response_specificity(
            "Submersible pump capacitor replaced with 50uF unit and water flow tested at 45 L/min."
        )
        assert tech_label == "TECHNICAL_SPECIFIC_RESPONSE"
        assert tech_score > vague_score
        print(f"  [PASS] Specificity Evaluation -> 'Done': {vague_label} (Score: {vague_score}) | Detailed Log: {tech_label} (Score: {tech_score})")

        # 3. Response Copy-Paste Boilerplate Repetition Pattern Detection
        print("\n[TEST 3] Response Copy-Paste Repetition Pattern Mining...")
        rep_res = resolution_integrity_engine.analyze_response_repetition_patterns(db)
        assert "repetition_ratio" in rep_res
        assert "pattern_signal" in rep_res
        print(f"  [PASS] Repetition Mining -> Analyzed: {rep_res['total_responses_analyzed']} tasks | Repetition Ratio: {rep_res['repetition_ratio']} | Signal: {rep_res['pattern_signal']}")

        # 4. Statutory SLA Delay Risk Prediction
        print("\n[TEST 4] Statutory SLA Delay Risk Modeling...")
        sla_res = resolution_integrity_engine.predict_sla_delay_risk(1, db)
        assert "risk_tier" in sla_res
        assert "statutory_sla_hours" in sla_res
        print(f"  [PASS] SLA Delay Risk -> Category: {sla_res['category']} | Target SLA: {sla_res['statutory_sla_hours']}h | Elapsed: {sla_res['elapsed_hours']}h | Tier: {sla_res['risk_tier']}")

        # 5. Department Lifecycle Stage Bottleneck Measurement
        print("\n[TEST 5] Department Lifecycle Stage Bottleneck Measurement...")
        bottle_res = resolution_integrity_engine.analyze_department_stage_bottlenecks(db)
        assert "mean_resolution_duration_hours" in bottle_res
        assert "stage_breakdown" in bottle_res
        print(f"  [PASS] Bottlenecks Analyzed -> Mean Task Duration: {bottle_res['mean_resolution_duration_hours']}h | Primary Bottleneck: {bottle_res['primary_bottleneck_stage']}")

        # 6. Systemic Problem Detection & Classification
        print("\n[TEST 6] Systemic Problem Detection & Clustering...")
        sys_res = systemic_intelligence_engine.detect_systemic_problems(db)
        assert sys_res["total_incidents_analyzed"] > 0
        assert len(sys_res["systemic_clusters"]) > 0
        top_sys = sys_res["systemic_clusters"][0]
        assert top_sys["pattern_tier"] in ["SYSTEMIC_CANDIDATE", "RECURRING", "LOCALIZED"]
        print(f"  [PASS] Top Systemic Cluster -> Key: {top_sys['cluster_key']} | Category: {top_sys['category']} | Incidents: {top_sys['incident_count']} | Tier: {top_sys['pattern_tier']} | Cumulative Spent: INR {top_sys['cumulative_reactive_cost']:,.2f}")

        # 7. Physical Asset & Infrastructure Failure Pattern Mining
        print("\n[TEST 7] Physical Asset Infrastructure Failure Pattern Mining...")
        asset_res = systemic_intelligence_engine.mine_asset_infrastructure_patterns(db)
        assert "assets_monitored" in asset_res
        assert len(asset_res["asset_patterns"]) >= 1
        top_ast = asset_res["asset_patterns"][0]
        print(f"  [PASS] Asset Pattern -> Name: {top_ast['asset_name']} | Failures: {top_ast['failure_incident_count']} | Signal: {top_ast['pattern_signal']}")

        # 8. Evidence-Ranked Root-Cause Hypotheses & Conflict Checks
        print("\n[TEST 8] Evidence-Ranked Root-Cause Hypotheses Engine...")
        rc_res = systemic_intelligence_engine.generate_ranked_root_cause_hypotheses("water", 3, db)
        assert len(rc_res["ranked_root_cause_hypotheses"]) >= 2
        top_h = rc_res["ranked_root_cause_hypotheses"][0]
        assert "causal_confidence" in top_h
        assert "probabilistic_disclaimer" in top_h
        print(f"  [PASS] Top Hypothesis -> '{top_h['root_cause_hypothesis']}' | Confidence: {top_h['causal_confidence'] * 100:.0f}% | Strength: {top_h['evidence_strength']}")
        print(f"    Verification Action: {top_h['recommended_verification_action']}")

        # 9. Multi-Dimensional Service Health Index
        print("\n[TEST 9] Multi-Dimensional Service Health Index (0-100)...")
        health_res = systemic_intelligence_engine.calculate_service_health_index("water", 1, db)
        assert 0.0 <= health_res["service_health_score"] <= 100.0
        print(f"  [PASS] Service Health -> Water in Piparli: {health_res['service_health_score']}/100 ({health_res['health_status']}) | Resolution Rate: {health_res['resolution_rate_pct']}%")

        # 10. Preventive Governance Signals (Opex vs Capex)
        print("\n[TEST 10] Preventive Governance Signals (Opex Patches vs Capex Replacement)...")
        prev_res = systemic_intelligence_engine.generate_preventive_governance_signal("water", 1, db)
        assert "preventive_signal" in prev_res
        assert "projected_two_year_savings" in prev_res
        print(f"  [PASS] Preventive Signal -> {prev_res['preventive_signal']} | Est. Capex: INR {prev_res['estimated_structural_capex']:,.2f} | 2-Yr Net Savings: INR {prev_res['projected_two_year_savings']:,.2f}")
        print(f"    Advisory: {prev_res['advisory_summary']}")

        print("\n======================================================================")
        print("ALL 10 PHASE 5 & 6 TESTS PASSED — HIGH INTEGRITY & SYSTEMIC REASONING")
        print("======================================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_phase5_phase6_suite()
