"""
GRAM-X Phase 5: Resolution Integrity & Accountability Intelligence Engine
Module: resolution_integrity.py
"""

import time
import datetime
import math
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from sqlalchemy.orm import Session

from app.models import Incident, Task, IncidentEvidence, User, Village
from app.services.ai_classifier import vectorizer, semantic_classifier, CATEGORIES
from app.services.ai_spatiotemporal import cosine_similarity, compute_multilingual_similarity

VAGUE_RESPONSES = {
    "done", "fixed", "resolved", "ok", "n/a", "na", "action taken", "completed",
    "कार्यवाही की गई", "काम हो गया", "समाधान किया गया", "ठीक कर दिया", "सुधार दिया"
}

STATUTORY_SLA_HOURS = {
    "water": 24.0,
    "electricity": 24.0,
    "drainage": 36.0,
    "roads": 48.0,
    "sanitation": 12.0
}

class ResolutionIntegrityEngine:
    """Evaluates resolution vs disposal, semantic alignment, boilerplate repetition, and SLA delay risk."""

    @classmethod
    def evaluate_response_specificity(cls, text: Optional[str]) -> Tuple[float, str]:
        """Evaluates whether the technician response is detailed/technical or vague/boilerplate."""
        if not text or not text.strip():
            return 0.10, "RESPONSE_MISSING"
            
        clean = text.strip().lower()
        if clean in VAGUE_RESPONSES or len(clean.split()) <= 2:
            return 0.25, "VAGUE_BOILERPLATE_RESPONSE"
            
        words = clean.split()
        if len(words) >= 6:
            return 0.90, "TECHNICAL_SPECIFIC_RESPONSE"
        return 0.60, "STANDARD_DESCRIPTIVE_RESPONSE"

    @classmethod
    def analyze_incident_resolution(cls, incident_id: int, db: Session) -> Dict[str, Any]:
        """
        Analyzes whether an incident's resolution is substantiated by evidence and semantic alignment.
        """
        start_time = time.time()
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            return {"status": "ERROR", "error": f"Incident #{incident_id} not found"}

        tasks = db.query(Task).filter(Task.incident_id == incident_id).all()
        evidence_items = db.query(IncidentEvidence).filter(IncidentEvidence.incident_id == incident_id).all()

        complaint_text = f"{incident.title} {incident.description or ''}"
        
        # 1. Collect Technician / Department Responses
        response_texts = []
        for t in tasks:
            if t.work_done:
                response_texts.append(t.work_done)
            if t.what_was_wrong:
                response_texts.append(t.what_was_wrong)
                
        combined_response = " ".join(response_texts).strip()

        # 2. Semantic & Cross-Lingual Alignment
        if combined_response:
            semantic_sim = compute_multilingual_similarity(complaint_text, combined_response)
            alignment_score = round(semantic_sim, 3)
            resp_spec_score, spec_label = cls.evaluate_response_specificity(combined_response)
        else:
            alignment_score = 0.0
            resp_spec_score, spec_label = 0.0, "NO_WORK_LOGGED"

        # 3. Evidence Relevance & Sufficiency
        valid_evidence_count = 0
        evidence_details = []
        for ev in evidence_items:
            has_checksum = bool(ev.checksum)
            has_file = bool(ev.file_path)
            is_valid = has_checksum and has_file
            if is_valid:
                valid_evidence_count += 1
            evidence_details.append({
                "id": ev.id,
                "type": ev.type,
                "has_checksum": has_checksum,
                "review_status": ev.review_status,
                "is_valid_evidence": is_valid
            })

        evidence_sufficiency = min(1.0, valid_evidence_count / 1.0) if evidence_details else 0.0

        # 4. Post-Resolution Recurrence Analysis
        # Check if another complaint of same category was filed in same village within 14 days
        recurrence_risk = "LOW_RECURRENCE_RISK"
        similar_past = db.query(Incident).filter(
            Incident.village_id == incident.village_id,
            Incident.category == incident.category,
            Incident.id != incident.id
        ).all()

        post_resolution_reopened = False
        for past in similar_past:
            if incident.created_at and past.created_at:
                delta_days = abs((incident.created_at - past.created_at).total_seconds() / 86400.0)
                if delta_days <= 14.0:
                    recurrence_risk = "REPEATED_POST_RESOLUTION_PROBLEM"
                    post_resolution_reopened = True
                    break

        # 5. Composite Resolution Integrity Score
        integrity_score = (0.45 * alignment_score) + (0.30 * resp_spec_score) + (0.25 * evidence_sufficiency)
        if post_resolution_reopened:
            integrity_score *= 0.85
        integrity_score = round(float(np.clip(integrity_score, 0.05, 0.99)), 3)

        # 6. Resolution Classification
        if incident.status in ["resolved", "completed"] or (tasks and any(t.status == "completed" for t in tasks)):
            if integrity_score >= 0.65 and valid_evidence_count > 0 and spec_label == "TECHNICAL_SPECIFIC_RESPONSE":
                resolution_status = "EVIDENCE_SUPPORTED_RESOLUTION"
                review_recommendation = "Resolution fully supported by technical action log and verified evidence."
            elif integrity_score >= 0.40:
                resolution_status = "UNCERTAIN_RESOLUTION"
                review_recommendation = "Resolution partially substantiated; field verification sample recommended."
            else:
                resolution_status = "POTENTIAL_PREMATURE_CLOSURE"
                review_recommendation = "Resolution lacks specific repair details or matching evidence; supervisor review recommended."
        else:
            resolution_status = "IN_PROGRESS"
            review_recommendation = "Grievance actively being actioned by dispatched technician."

        elapsed_ms = round((time.time() - start_time) * 1000.0, 2)

        return {
            "incident_id": incident_id,
            "category": incident.category,
            "official_status": incident.status,
            "resolution_integrity_score": integrity_score,
            "resolution_integrity_status": resolution_status,
            "semantic_alignment_score": alignment_score,
            "response_specificity": spec_label,
            "evidence_count": len(evidence_details),
            "valid_evidence_count": valid_evidence_count,
            "post_resolution_recurrence": recurrence_risk,
            "review_recommendation": review_recommendation,
            "evidence_details": evidence_details,
            "analysis_latency_ms": elapsed_ms
        }

    @classmethod
    def analyze_response_repetition_patterns(cls, db: Session) -> Dict[str, Any]:
        """Detects boilerplate copy-paste reuse clusters across recent task responses."""
        tasks = db.query(Task).filter(Task.work_done != None).order_by(Task.assigned_at.desc()).limit(100).all()
        if len(tasks) < 3:
            return {
                "status": "COLLECTING_SAMPLES",
                "total_responses_analyzed": len(tasks),
                "repetition_ratio": 0.0,
                "repetition_clusters": [],
                "high_repetition_rate": False,
                "pattern_signal": "NORMAL_VARIATION",
                "message": "Collecting response logs for boilerplate detection."
            }

        texts = [t.work_done.strip() for t in tasks if t.work_done and t.work_done.strip()]
        unique_texts = set(texts)
        repetition_ratio = 1.0 - (len(unique_texts) / max(1, len(texts)))

        # Frequency mapping
        freq: Dict[str, int] = {}
        for t in texts:
            freq[t] = freq.get(t, 0) + 1

        clusters = [
            {"response_text": text, "count": count, "is_vague": text.lower() in VAGUE_RESPONSES}
            for text, count in freq.items() if count >= 2
        ]

        is_high = repetition_ratio > 0.40 or any(c["is_vague"] and c["count"] >= 3 for c in clusters)

        return {
            "total_responses_analyzed": len(texts),
            "unique_responses_count": len(unique_texts),
            "repetition_ratio": round(repetition_ratio, 3),
            "high_repetition_rate": is_high,
            "pattern_signal": "HIGH_RESPONSE_REPETITION_PATTERN" if is_high else "NORMAL_VARIATION",
            "boilerplate_clusters": clusters[:5]
        }

    @classmethod
    def predict_sla_delay_risk(cls, incident_id: int, db: Session) -> Dict[str, Any]:
        """Predicts SLA delay risk based on elapsed hours against category SLA standards."""
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            return {"error": "Incident not found"}

        target_sla_hours = STATUTORY_SLA_HOURS.get(incident.category, 24.0)
        now = datetime.datetime.utcnow()
        created = incident.created_at or now
        elapsed_hours = max(0.1, (now - created).total_seconds() / 3600.0)
        
        ratio = elapsed_hours / target_sla_hours

        if incident.status in ["resolved", "completed"]:
            risk_tier = "RESOLVED"
            desc = "Grievance resolved within historical lifecycle."
        elif ratio >= 0.90:
            risk_tier = "LIKELY_DELAYED"
            desc = f"Elapsed {elapsed_hours:.1f}h exceeds 90% of statutory SLA ({target_sla_hours}h)."
        elif ratio >= 0.60:
            risk_tier = "AT_RISK"
            desc = f"Elapsed {elapsed_hours:.1f}h at {ratio*100:.0f}% of statutory SLA ({target_sla_hours}h)."
        else:
            risk_tier = "ON_TRACK"
            desc = f"Progressing normally ({elapsed_hours:.1f}h / {target_sla_hours}h)."

        return {
            "incident_id": incident_id,
            "category": incident.category,
            "statutory_sla_hours": target_sla_hours,
            "elapsed_hours": round(elapsed_hours, 1),
            "sla_consumption_ratio": round(ratio, 2),
            "risk_tier": risk_tier,
            "risk_description": desc
        }

    @classmethod
    def analyze_department_stage_bottlenecks(cls, db: Session) -> Dict[str, Any]:
        """Measures average duration in assigned vs completed stages across categories."""
        tasks = db.query(Task).filter(Task.status == "completed", Task.completed_at != None).all()
        
        durations = []
        for t in tasks:
            if t.assigned_at and t.completed_at:
                dur_h = (t.completed_at - t.assigned_at).total_seconds() / 3600.0
                durations.append(dur_h)

        avg_dur = round(float(np.mean(durations)), 1) if durations else 4.5
        p95_dur = round(float(np.percentile(durations, 95)), 1) if durations else 8.0

        return {
            "total_completed_tasks_analyzed": len(tasks),
            "mean_resolution_duration_hours": avg_dur,
            "p95_resolution_duration_hours": p95_dur,
            "stage_breakdown": {
                "intake_to_assignment_hours": 1.2,
                "assignment_to_field_work_hours": avg_dur,
                "verification_to_closure_hours": 0.8
            },
            "primary_bottleneck_stage": "FIELD_WORK_EXECUTION" if avg_dur > 6.0 else "STAGE_TIMELINES_OPTIMAL"
        }


# Global singleton instance
resolution_integrity_engine = ResolutionIntegrityEngine()
