"""
GRAM-X Evidence Intelligence, Trust & Verification Router (Phase 53)
Provides enterprise endpoints for:
- Evidence upload with real-time SHA-256 integrity, location validation & duplicate detection
- Multi-mode Before/After evidence package retrieval (side-by-side, slider, timeline)
- Human administrative verification, rejection & more-evidence requests with versioning
- Dynamic storage bit-integrity reverification
- Evidence integrity dashboard stats & server-authorized report exports
"""

import csv
import io
import json
import base64
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User, Incident, Task, IncidentEvidence, StoredFile, AuditLog, Notification
)
from app.services.auth_utils import get_current_user
from app.services.storage_service import storage_service
from app.services.evidence_intelligence_service import evidence_intelligence_service
from app.services.audit_chain import record_audit_event
from app.services.outbox_service import outbox_service

logger = logging.getLogger("gramx.evidence_api")
evidence_router = APIRouter(prefix="/evidence", tags=["Evidence Intelligence & Verification"])

# ─────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────

class EvidenceUploadRequest(BaseModel):
    incident_id: int
    task_id: Optional[int] = None
    type: str = Field("photo", description="photo, audio, document, sensor")
    filename: str = "evidence.jpg"
    mime_type: str = "image/jpeg"
    file_base64: str
    captured_at: Optional[str] = None  # ISO format client capture time
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    parent_evidence_id: Optional[int] = None

class EvidenceVerifyActionRequest(BaseModel):
    action: str = Field("verify", description="verify, reject, request_more_evidence")
    remarks: Optional[str] = None
    required_evidence_type: Optional[str] = "photo"
    deadline_hours: Optional[int] = 24


# ─────────────────────────────────────────────────────────────
# 1. EVIDENCE UPLOAD & TRUST PIPELINE
# ─────────────────────────────────────────────────────────────

@evidence_router.post("/upload")
def upload_trusted_evidence(
    req: EvidenceUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ingests multimedia evidence, enforces SHA-256 calculation, duplicate check,
    location consistency check, capture-vs-upload timestamp tracking, and immutable persistence.
    """
    incident = db.query(Incident).filter(Incident.id == req.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    # Authorization Check
    if current_user.role == "citizen" and incident.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only attach evidence to your own complaints.")

    # Decode binary payload
    try:
        raw_b64 = req.file_base64.split(",")[-1] if "," in req.file_base64 else req.file_base64
        data_bytes = base64.b64decode(raw_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 payload: {e}")

    # Parse capture timestamp if provided
    cap_time = None
    if req.captured_at:
        try:
            cap_time = datetime.fromisoformat(req.captured_at.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            cap_time = None

    # Evaluate Evidence Trust, Duplicates & Signals
    eval_res = evidence_intelligence_service.evaluate_evidence_trust(
        db=db,
        data_bytes=data_bytes,
        mime_type=req.mime_type,
        incident_id=req.incident_id,
        task_id=req.task_id,
        captured_at=cap_time,
        capture_lat=req.latitude,
        capture_lon=req.longitude
    )

    # If exact duplicate on same incident/task -> reject or return existing
    if eval_res["is_exact_duplicate"]:
        existing = db.query(IncidentEvidence).filter(
            IncidentEvidence.checksum == eval_res["checksum"],
            IncidentEvidence.incident_id == req.incident_id
        ).first()
        return {
            "status": "DUPLICATE_DETECTED",
            "message": "Identical evidence already exists for this complaint.",
            "evidence_id": existing.id if existing else None,
            "checksum": eval_res["checksum"],
            "risk_signals": eval_res["risk_signals"]
        }

    # Store File in Storage Backend (Local / S3)
    file_id, storage_key, f_size, checksum = storage_service.save_file_bytes(
        data_bytes,
        req.filename,
        req.mime_type
    )



    now = datetime.utcnow()

    # Create StoredFile record
    stored_file = StoredFile(
        file_id=file_id,
        storage_key=storage_key,
        original_filename=req.filename,
        mime_type=req.mime_type,
        file_size=f_size,
        checksum=checksum,
        owner_id=current_user.id,
        resource_type="incident_evidence",
        resource_id=req.incident_id,
        upload_status="completed"
    )
    db.add(stored_file)

    # Create IncidentEvidence record
    evidence = IncidentEvidence(
        incident_id=req.incident_id,
        task_id=req.task_id,
        type=req.type,
        file_path=storage_key,
        file_type=req.mime_type,
        file_size=f_size,
        checksum=checksum,
        captured_at=cap_time,
        uploaded_at=now,
        latitude=req.latitude,
        longitude=req.longitude,
        parent_evidence_id=req.parent_evidence_id,
        perceptual_hash=eval_res["perceptual_hash"],
        quality_grade=eval_res["quality_grade"],
        risk_level=eval_res["risk_level"],
        risk_signals_json=json.dumps(eval_res["risk_signals"]),
        review_status=eval_res["recommended_status"],
        uploaded_by=current_user.id
    )
    db.add(evidence)
    db.flush()

    # Record SHA-256 Audit Event
    record_audit_event(
        db=db,
        action="EVIDENCE_UPLOADED",
        user_id=current_user.id,
        details=f"EVIDENCE_UPLOADED: ID #{evidence.id}, Incident #{req.incident_id}, Type: {req.type}, Checksum: {checksum[:16]}..., Risk: {eval_res['risk_level']}"
    )

    # Queue Real-Time Outbox Event for Admin & Collector
    outbox_service.record_event(
        db=db,
        event_type="EVIDENCE_SUBMITTED",
        channel="admin",
        payload={
            "evidence_id": evidence.id,
            "incident_id": req.incident_id,
            "task_id": req.task_id,
            "type": req.type,
            "uploader_name": current_user.name,
            "risk_level": eval_res["risk_level"],
            "uploaded_at": now.isoformat()
        }
    )

    db.commit()
    db.refresh(evidence)

    return {
        "status": "success",
        "evidence_id": evidence.id,
        "incident_id": evidence.incident_id,
        "task_id": evidence.task_id,
        "storage_key": storage_key,
        "checksum": checksum,
        "file_size": f_size,
        "captured_at": evidence.captured_at.isoformat() if evidence.captured_at else None,
        "uploaded_at": evidence.uploaded_at.isoformat(),
        "location_distance_meters": eval_res["distance_meters"],
        "quality_grade": evidence.quality_grade,
        "risk_level": evidence.risk_level,
        "risk_signals": eval_res["risk_signals"],
        "review_status": evidence.review_status
    }


# ─────────────────────────────────────────────────────────────
# 2. EVIDENCE VERIFICATION & VERSIONING
# ─────────────────────────────────────────────────────────────

@evidence_router.post("/{evidence_id}/verify")
def verify_or_reject_evidence(
    evidence_id: int,
    req: EvidenceVerifyActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Human Administrator Verification:
    Allows authorized administrators to verify evidence, reject evidence with reason,
    or request additional evidence from the worker with versioning.
    """
    if current_user.role not in ["admin", "super_admin", "district"]:
        raise HTTPException(status_code=403, detail="Evidence verification restricted to Administrators.")

    ev = db.query(IncidentEvidence).filter(IncidentEvidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence record not found.")

    now = datetime.utcnow()
    ev.reviewed_by = current_user.name
    ev.reviewed_at = now
    ev.review_remarks = req.remarks

    if req.action == "verify":
        ev.review_status = "verified"
        audit_action = "EVIDENCE_VERIFIED"
        msg = f"Evidence #{ev.id} verified by {current_user.name}."
    elif req.action == "reject":
        ev.review_status = "rejected"
        audit_action = "EVIDENCE_REJECTED"
        msg = f"Evidence #{ev.id} rejected by {current_user.name}. Reason: {req.remarks or 'Unspecified'}."
    elif req.action == "request_more_evidence":
        ev.review_status = "under_review"
        audit_action = "MORE_EVIDENCE_REQUESTED"
        msg = f"Additional evidence requested: {req.remarks or 'Please submit updated photo.'}"

        # Notify assigned worker
        if ev.uploaded_by:
            db.add(Notification(
                recipient_id=ev.uploaded_by,
                recipient_role="worker",
                event_type="EVIDENCE_REQUEST",
                severity="warning",
                message=f"Action Required: Admin requested more evidence on INC-{ev.incident_id}. Reason: {req.remarks or 'N/A'}",
                reference_type="incident",
                reference_id=ev.incident_id,
                created_at=now
            ))
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported action '{req.action}'.")

    # Record Audit Event
    record_audit_event(
        db=db,
        action=audit_action,
        user_id=current_user.id,
        details=f"{audit_action}: Evidence #{ev.id}, Incident #{ev.incident_id}. {msg}"
    )

    db.commit()
    db.refresh(ev)

    return {
        "status": "success",
        "evidence_id": ev.id,
        "action": req.action,
        "verification_status": ev.review_status,
        "reviewed_by": ev.reviewed_by,
        "reviewed_at": ev.reviewed_at.isoformat()
    }


# ─────────────────────────────────────────────────────────────
# 3. REAL-TIME STORAGE INTEGRITY REVERIFICATION
# ─────────────────────────────────────────────────────────────

@evidence_router.get("/{evidence_id}/integrity")
def check_evidence_bit_integrity(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Dynamic Bit-Integrity Check:
    Reads physical bytes from storage and re-calculates cryptographic SHA-256 digest.
    """
    ev = db.query(IncidentEvidence).filter(IncidentEvidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found.")

    if not ev.file_path or not ev.checksum:
        raise HTTPException(status_code=400, detail="Evidence lacks storage key or expected checksum.")

    result = evidence_intelligence_service.verify_stored_evidence_integrity(
        storage_key=ev.file_path,
        expected_checksum=ev.checksum
    )
    return result


# ─────────────────────────────────────────────────────────────
# 4. BEFORE / AFTER COMPARISON PACKAGE
# ─────────────────────────────────────────────────────────────

@evidence_router.get("/incident/{incident_id}/package")
def get_incident_evidence_package(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Comprehensive Before/After Evidence Package:
    Returns paired original vs resolution evidence, timestamps (captured vs uploaded),
    location consistency, and audit verification states.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    # Scoping: Citizen sees own safe evidence only
    if current_user.role == "citizen" and incident.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    all_evidence = db.query(IncidentEvidence).filter(
        IncidentEvidence.incident_id == incident_id
    ).order_by(IncidentEvidence.id.asc()).all()

    before_list = []
    after_list = []

    for e in all_evidence:
        uploader = db.query(User).filter(User.id == e.uploaded_by).first() if e.uploaded_by else None
        item = {
            "id": e.id,
            "type": e.type,
            "storage_key": e.file_path,
            "download_url": f"/api/storage/files/{e.file_path}" if e.file_path else None,
            "file_size": e.file_size,
            "checksum": e.checksum if current_user.role != "citizen" else None,
            "captured_at": e.captured_at.isoformat() if e.captured_at else None,
            "uploaded_at": e.uploaded_at.isoformat() if e.uploaded_at else None,
            "latitude": e.latitude,
            "longitude": e.longitude,
            "quality_grade": e.quality_grade,
            "risk_level": e.risk_level if current_user.role != "citizen" else None,
            "risk_signals": json.loads(e.risk_signals_json) if (e.risk_signals_json and current_user.role != "citizen") else [],
            "verification_status": e.review_status,
            "reviewed_by": e.reviewed_by,
            "reviewed_at": e.reviewed_at.isoformat() if e.reviewed_at else None,
            "uploader_name": uploader.name if uploader else "Citizen/Worker",
            "uploader_role": uploader.role if uploader else "citizen"
        }
        if e.task_id:
            after_list.append(item)
        else:
            before_list.append(item)

    return {
        "incident_id": incident.id,
        "title": incident.title,
        "category": incident.category,
        "status": incident.status,
        "before_evidence": before_list,
        "after_evidence": after_list,
        "total_evidence_count": len(all_evidence),
        "package_generated_at": datetime.utcnow().isoformat()
    }


# ─────────────────────────────────────────────────────────────
# 5. EVIDENCE INTEGRITY DASHBOARD & EXPORT
# ─────────────────────────────────────────────────────────────

@evidence_router.get("/dashboard/stats")
def get_evidence_integrity_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Evidence Integrity Dashboard Metrics:
    Calculates live counts of verified, pending, flagged, and duplicate evidence.
    """
    if current_user.role not in ["admin", "district", "super_admin"]:
        raise HTTPException(status_code=403, detail="Evidence Dashboard restricted to Administrators.")

    total_evidence = db.query(IncidentEvidence).count()
    verified_count = db.query(IncidentEvidence).filter(IncidentEvidence.review_status == "verified").count()
    pending_count = db.query(IncidentEvidence).filter(IncidentEvidence.review_status.in_(["pending", "under_review"])).count()
    rejected_count = db.query(IncidentEvidence).filter(IncidentEvidence.review_status == "rejected").count()
    flagged_count = db.query(IncidentEvidence).filter(IncidentEvidence.risk_level.in_(["MEDIUM", "HIGH"])).count()

    verification_rate = round((verified_count / total_evidence * 100), 1) if total_evidence > 0 else 100.0

    return {
        "total_evidence": total_evidence,
        "verified": verified_count,
        "pending": pending_count,
        "rejected": rejected_count,
        "flagged_risk": flagged_count,
        "verification_rate_pct": verification_rate,
        "calculated_at": datetime.utcnow().isoformat()
    }


@evidence_router.get("/export")
def export_evidence_report(
    format: str = Query("csv", pattern="^(csv|json)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Server-Authorized Evidence Verification Report Export."""
    if current_user.role not in ["admin", "district", "super_admin"]:
        raise HTTPException(status_code=403, detail="Export restricted to Administrators.")

    records = db.query(IncidentEvidence).all()

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Evidence ID", "Incident ID", "Task ID", "Type", "Checksum", "Quality Grade", "Risk Level", "Review Status", "Uploaded At"])
        for r in records:
            writer.writerow([
                r.id, r.incident_id, r.task_id or "", r.type, r.checksum or "",
                r.quality_grade, r.risk_level, r.review_status,
                r.uploaded_at.isoformat() if r.uploaded_at else ""
            ])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=gramx_evidence_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
        )

    return {
        "exported_by": current_user.name,
        "total_records": len(records),
        "exported_at": datetime.utcnow().isoformat(),
        "records": [{
            "id": r.id,
            "incident_id": r.incident_id,
            "task_id": r.task_id,
            "type": r.type,
            "checksum": r.checksum,
            "quality_grade": r.quality_grade,
            "risk_level": r.risk_level,
            "review_status": r.review_status,
            "uploaded_at": r.uploaded_at.isoformat() if r.uploaded_at else None
        } for r in records]
    }
