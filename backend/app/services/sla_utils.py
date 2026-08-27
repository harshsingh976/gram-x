import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import Incident, Task, AuditLog

# Authoritative SLA Thresholds in hours according to GRAM-X specification
SLA_THRESHOLDS: Dict[str, Dict[str, int]] = {
    "CRITICAL": {"response_hours": 1, "resolution_hours": 4},
    "HIGH": {"response_hours": 2, "resolution_hours": 8},
    "MEDIUM": {"response_hours": 4, "resolution_hours": 24},
    "LOW": {"response_hours": 8, "resolution_hours": 48}
}

def get_priority_category(severity: Optional[str] = None, score: Optional[float] = None) -> str:
    """Derives authoritative priority tier: CRITICAL, HIGH, MEDIUM, LOW."""
    if severity:
        sev_clean = str(severity).strip().upper()
        if sev_clean in SLA_THRESHOLDS:
            return sev_clean
    if score is not None:
        if score >= 80:
            return "CRITICAL"
        elif score >= 60:
            return "HIGH"
        elif score >= 40:
            return "MEDIUM"
        return "LOW"
    return "MEDIUM"

def get_sla_thresholds(priority: str) -> Dict[str, int]:
    return SLA_THRESHOLDS.get(priority.upper(), SLA_THRESHOLDS["MEDIUM"])

def calculate_incident_sla(incident: Incident, db: Session) -> Dict[str, Any]:
    """Calculates authoritative SLA parameters for an incident."""
    priority_cat = get_priority_category(severity=incident.severity, score=incident.priority_score)
    thresholds = get_sla_thresholds(priority_cat)
    
    base_time = incident.created_at or datetime.datetime.utcnow()
    expected_response_time = base_time + datetime.timedelta(hours=thresholds["response_hours"])
    expected_resolution_time = base_time + datetime.timedelta(hours=thresholds["resolution_hours"])
    
    actual_response_time = None
    actual_resolution_time = incident.resolved_at
    
    task = db.query(Task).filter(Task.incident_id == incident.id).first()
    if task:
        if task.status in ["accepted", "en_route", "in_progress", "completed"]:
            audit = db.query(AuditLog).filter(
                AuditLog.action == "TASK_ACCEPTED",
                AuditLog.details.like(f"%task ID {task.id}%")
            ).first()
            if audit:
                actual_response_time = audit.timestamp
            else:
                actual_response_time = task.assigned_at
        
        if task.status == "completed":
            actual_resolution_time = task.completed_at or incident.resolved_at
            
    now = datetime.datetime.utcnow()
    if incident.status in ["resolved", "verified", "completed", "resolved_confirmed"]:
        sla_status = "RESOLVED"
        remaining_seconds = 0.0
    else:
        remaining_seconds = (expected_resolution_time - now).total_seconds()
        total_seconds = thresholds["resolution_hours"] * 3600.0
        consumed_seconds = (now - base_time).total_seconds()
        consumption_ratio = (consumed_seconds / total_seconds) if total_seconds > 0 else 1.0
        
        if remaining_seconds <= 0 or consumption_ratio >= 1.0:
            sla_status = "BREACHED"
            trigger_auto_escalation(incident, now - base_time, db)
        elif consumption_ratio >= 0.90:
            sla_status = "CRITICAL"
            trigger_sla_risk_notification(incident, "CRITICAL", db)
        elif consumption_ratio >= 0.75:
            sla_status = "AT_RISK"
            trigger_sla_risk_notification(incident, "AT_RISK", db)
        else:
            sla_status = "ON_TRACK"
            
    return {
        "reported_time": base_time,
        "priority": priority_cat,
        "response_hours": thresholds["response_hours"],
        "resolution_hours": thresholds["resolution_hours"],
        "expected_response_time": expected_response_time,
        "actual_response_time": actual_response_time,
        "expected_resolution_time": expected_resolution_time,
        "actual_resolution_time": actual_resolution_time,
        "remaining_seconds": max(0.0, remaining_seconds) if sla_status != "BREACHED" else 0.0,
        "sla_status": sla_status
    }

def calculate_task_sla(task: Task, db: Session) -> Dict[str, Any]:
    """Calculates authoritative SLA parameters for a worker task."""
    incident = db.query(Incident).filter(Incident.id == task.incident_id).first()
    if not incident:
        priority_cat = "MEDIUM"
        thresholds = SLA_THRESHOLDS["MEDIUM"]
        base_time = task.assigned_at or datetime.datetime.utcnow()
    else:
        priority_cat = get_priority_category(severity=incident.severity, score=incident.priority_score)
        thresholds = get_sla_thresholds(priority_cat)
        base_time = incident.created_at or task.assigned_at or datetime.datetime.utcnow()

    expected_response_time = base_time + datetime.timedelta(hours=thresholds["response_hours"])
    expected_resolution_time = base_time + datetime.timedelta(hours=thresholds["resolution_hours"])
    
    now = datetime.datetime.utcnow()
    if task.status == "completed" or (incident and incident.status in ["resolved", "verified", "completed", "resolved_confirmed"]):
        sla_status = "RESOLVED"
        remaining_seconds = 0.0
    else:
        remaining_seconds = (expected_resolution_time - now).total_seconds()
        total_seconds = thresholds["resolution_hours"] * 3600.0
        consumed_seconds = (now - base_time).total_seconds()
        consumption_ratio = (consumed_seconds / total_seconds) if total_seconds > 0 else 1.0
        
        if remaining_seconds <= 0 or consumption_ratio >= 1.0:
            sla_status = "BREACHED"
            if incident:
                trigger_auto_escalation(incident, now - base_time, db)
        elif consumption_ratio >= 0.90:
            sla_status = "CRITICAL"
        elif consumption_ratio >= 0.75:
            sla_status = "AT_RISK"
        else:
            sla_status = "ON_TRACK"

    return {
        "sla_priority": priority_cat,
        "sla_response_hours": thresholds["response_hours"],
        "sla_resolution_hours": thresholds["resolution_hours"],
        "sla_expected_response_time": expected_response_time,
        "sla_expected_resolution_time": expected_resolution_time,
        "sla_remaining_seconds": remaining_seconds,
        "sla_status": sla_status
    }

def create_notification(
    db: Session,
    recipient_role: str,
    event_type: str,
    severity: str,
    message: str,
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
    recipient_id: Optional[int] = None
):
    """Safely creates deduplicated notification records in database."""
    try:
        from app.models import Notification
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
        existing = db.query(Notification).filter(
            Notification.event_type == event_type,
            Notification.reference_type == reference_type,
            Notification.reference_id == reference_id,
            Notification.created_at >= cutoff
        ).first()
        if existing:
            return existing

        notif = Notification(
            recipient_id=recipient_id,
            recipient_role=recipient_role,
            event_type=event_type,
            severity=severity,
            message=message,
            reference_type=reference_type,
            reference_id=reference_id,
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
    except Exception:
        db.rollback()
        return None

def trigger_sla_risk_notification(incident: Incident, risk_level: str, db: Session) -> None:
    """Triggers deduplicated alert when SLA approaches threshold."""
    existing = db.query(AuditLog).filter(
        AuditLog.action == f"SLA_{risk_level}",
        AuditLog.details.like(f"%Incident ID {incident.id}%")
    ).first()
    if not existing:
        log = AuditLog(
            action=f"SLA_{risk_level}",
            timestamp=datetime.datetime.utcnow(),
            details=f"SLA_{risk_level}: Incident ID {incident.id} ('{incident.title}') reached {risk_level} threshold."
        )
        db.add(log)
        create_notification(
            db=db,
            recipient_role="admin",
            event_type=f"SLA_{risk_level}",
            severity="warning" if risk_level == "AT_RISK" else "critical",
            message=f"SLA {risk_level}: Incident INC-{incident.id} ('{incident.title}') is near deadline.",
            reference_type="incident",
            reference_id=incident.id
        )
        try:
            db.commit()
        except Exception:
            db.rollback()

def trigger_auto_escalation(incident: Incident, elapsed: datetime.timedelta, db: Session) -> None:
    """Idempotently triggers escalation log, notification and status update."""
    existing_esc = db.query(AuditLog).filter(
        AuditLog.action == "INCIDENT_ESCALATED",
        AuditLog.details.like(f"%Incident ID {incident.id}%")
    ).first()
    
    if not existing_esc:
        priority_cat = get_priority_category(severity=incident.severity, score=incident.priority_score)
        delay_minutes = max(1, int(elapsed.total_seconds() / 60))
        from app.services.audit_chain import record_audit_event
        record_audit_event(
            db=db,
            action="INCIDENT_ESCALATED",
            details=f"INCIDENT_ESCALATED: Incident ID {incident.id}. Reason: Resolution SLA breached. Priority: {priority_cat}. Delay: {delay_minutes} minutes."
        )

        
        record_audit_event(
            db=db,
            action="SLA_BREACHED",
            details=f"SLA_BREACHED: Incident INC-{incident.id} exceeded resolution deadline."
        )


        create_notification(
            db=db,
            recipient_role="admin",
            event_type="SLA_BREACHED",
            severity="critical",
            message=f"🚨 SLA BREACHED: Incident INC-{incident.id} ('{incident.title}') exceeded resolution SLA!",
            reference_type="incident",
            reference_id=incident.id
        )
        create_notification(
            db=db,
            recipient_role="district",
            event_type="SLA_BREACHED",
            severity="critical",
            message=f"District SLA Breach Alert: Incident INC-{incident.id} in Village #{incident.village_id} has breached SLA.",
            reference_type="incident",
            reference_id=incident.id
        )
        
        if incident.status not in ["resolved", "verified", "completed", "resolved_confirmed"]:
            incident.status = "escalated"
            
        try:
            db.commit()
        except Exception:
            db.rollback()
