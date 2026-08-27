"""
GRAM-X Early Warning & Preventive Action Engine (Phase 54)
Implements:
- Rule-based & Model-guided Early Warning Alert generation from real database state
- Idempotent alert deduplication via SHA-256 fingerprinting
- Real-time Outbox dispatch to Collector and Admin WebSocket channels
- Alert lifecycle state management (OPEN -> ACKNOWLEDGED -> INVESTIGATING -> ACTIONED -> CLOSED)
- Preventive Work Order workflow (Distinguishing Reactive vs. Preventive actions)
"""

import json
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models import (
    EarlyWarningAlert, PreventiveWorkOrder, Incident, Task, Technician, Village, User, AuditLog
)
from app.services.audit_chain import record_audit_event
from app.services.outbox_service import outbox_service

logger = logging.getLogger("gramx.early_warning")

class EarlyWarningService:
    """Proactive Alerting and Preventive Action Engine."""

    def compute_alert_fingerprint(self, alert_type: str, scope_type: str, scope_id: Optional[int], category: Optional[str]) -> str:
        """Calculates deterministic fingerprint to deduplicate active alerts."""
        payload = f"{alert_type}|{scope_type}|{scope_id or 0}|{category or 'ALL'}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def evaluate_and_generate_alerts(self, db: Session) -> List[EarlyWarningAlert]:
        """
        Scans database records for recurring issues, volume surges, and SLA risks,
        generating deduplicated actionable early warning alerts.
        """
        generated_alerts = []
        now = datetime.utcnow()

        # 1. Check for Recurring Infrastructure Hotspots
        from app.services.predictive_governance_service import predictive_governance_service
        hotspots = predictive_governance_service.detect_spatial_hotspots(db)

        for hs in hotspots:
            if hs["is_recurring_cluster"]:
                fp = self.compute_alert_fingerprint(
                    "RECURRING_INFRASTRUCTURE_ISSUE", "panchayat", hs["village_id"], hs["category"]
                )
                existing = db.query(EarlyWarningAlert).filter(
                    EarlyWarningAlert.fingerprint == fp,
                    EarlyWarningAlert.status.in_(["open", "acknowledged", "investigating"])
                ).first()

                if not existing:
                    alert = EarlyWarningAlert(
                        alert_type="RECURRING_INFRASTRUCTURE_ISSUE",
                        severity="HIGH" if hs["open_complaints"] >= 2 else "WARNING",
                        title=f"Recurring {hs['category'].capitalize()} Infrastructure Issue in {hs['village_name']}",
                        summary=f"Cluster of {hs['total_complaints']} complaints detected in {hs['village_name']}. {hs['open_complaints']} currently active with {hs['sla_breaches']} SLA breaches.",
                        scope_type="panchayat",
                        scope_id=hs["village_id"],
                        category=hs["category"],
                        contributing_factors_json=json.dumps([
                            f"Total historical complaints: {hs['total_complaints']}",
                            f"Open backlog cases: {hs['open_complaints']}",
                            f"SLA breaches: {hs['sla_breaches']}"
                        ]),
                        supporting_metrics_json=json.dumps(hs),
                        status="open",
                        fingerprint=fp,
                        created_at=now,
                        updated_at=now
                    )
                    db.add(alert)
                    db.flush()

                    # Audit Event
                    record_audit_event(
                        db=db,
                        action="EARLY_WARNING_GENERATED",
                        details=f"EARLY_WARNING_GENERATED: Alert #{alert.id} ({alert.alert_type}) in {hs['village_name']}."
                    )

                    # Real-time Outbox Notification for District & Admin
                    outbox_service.record_event(
                        db=db,
                        event_type="EARLY_WARNING_ALERT",
                        channel="district",
                        payload={
                            "alert_id": alert.id,
                            "title": alert.title,
                            "severity": alert.severity,
                            "category": alert.category,
                            "scope": hs["village_name"]
                        }
                    )
                    generated_alerts.append(alert)

        # 2. Check for SLA Escalation Surge
        escalated_count = db.query(Incident).filter(Incident.status == "escalated").count()
        if escalated_count >= 1:
            fp_sla = self.compute_alert_fingerprint("SLA_BREACH_SURGE", "district", 0, "ALL")
            existing_sla = db.query(EarlyWarningAlert).filter(
                EarlyWarningAlert.fingerprint == fp_sla,
                EarlyWarningAlert.status.in_(["open", "acknowledged", "investigating"])
            ).first()

            if not existing_sla:
                alert_sla = EarlyWarningAlert(
                    alert_type="SLA_BREACH_SURGE",
                    severity="CRITICAL",
                    title="Active Grievance SLA Escalations Detected",
                    summary=f"District monitoring detected {escalated_count} active grievances exceeding resolution deadlines and escalated to District Collector.",
                    scope_type="district",
                    scope_id=0,
                    category="all",
                    contributing_factors_json=json.dumps([
                        f"Active escalated grievances: {escalated_count}",
                        "Statutory resolution timeline exceeded"
                    ]),
                    supporting_metrics_json=json.dumps({"escalated_count": escalated_count}),
                    status="open",
                    fingerprint=fp_sla,
                    created_at=now,
                    updated_at=now
                )
                db.add(alert_sla)
                db.flush()

                record_audit_event(
                    db=db,
                    action="EARLY_WARNING_GENERATED",
                    details=f"EARLY_WARNING_GENERATED: Alert #{alert_sla.id} (SLA_BREACH_SURGE)."
                )

                outbox_service.record_event(
                    db=db,
                    event_type="EARLY_WARNING_ALERT",
                    channel="district",
                    payload={"alert_id": alert_sla.id, "title": alert_sla.title, "severity": alert_sla.severity}
                )
                generated_alerts.append(alert_sla)

        db.commit()
        return generated_alerts

    def acknowledge_alert(self, db: Session, alert_id: int, user: User) -> EarlyWarningAlert:
        """Transitions alert to ACKNOWLEDGED state."""
        alert = db.query(EarlyWarningAlert).filter(EarlyWarningAlert.id == alert_id).first()
        if not alert:
            raise ValueError("Alert not found.")

        now = datetime.utcnow()
        alert.status = "acknowledged"
        alert.acknowledged_by = user.name
        alert.acknowledged_at = now
        alert.updated_at = now

        record_audit_event(
            db=db,
            action="EARLY_WARNING_ACKNOWLEDGED",
            user_id=user.id,
            details=f"EARLY_WARNING_ACKNOWLEDGED: Alert #{alert.id} acknowledged by {user.name}."
        )
        db.commit()
        db.refresh(alert)
        return alert

    def action_alert(
        self,
        db: Session,
        alert_id: int,
        target_status: str,
        user: User,
        action_taken: str
    ) -> EarlyWarningAlert:
        """Transitions alert to INVESTIGATING, ACTIONED, or CLOSED."""
        alert = db.query(EarlyWarningAlert).filter(EarlyWarningAlert.id == alert_id).first()
        if not alert:
            raise ValueError("Alert not found.")

        now = datetime.utcnow()
        alert.status = target_status
        alert.action_taken = action_taken
        alert.actioned_by = user.name
        alert.actioned_at = now
        alert.updated_at = now

        record_audit_event(
            db=db,
            action=f"EARLY_WARNING_{target_status.upper()}",
            user_id=user.id,
            details=f"EARLY_WARNING_{target_status.upper()}: Alert #{alert.id}. Action: '{action_taken}' by {user.name}."
        )
        db.commit()
        db.refresh(alert)
        return alert

    def propose_preventive_work_order(
        self,
        db: Session,
        alert_id: Optional[int],
        title: str,
        description: str,
        category: str,
        village_id: int,
        user: User
    ) -> PreventiveWorkOrder:
        """Creates a proposed Preventive Work Order based on early warning intelligence."""
        now = datetime.utcnow()
        order = PreventiveWorkOrder(
            alert_id=alert_id,
            title=title,
            description=description,
            category=category,
            village_id=village_id,
            status="proposed",
            proposed_by=user.name,
            created_at=now
        )
        db.add(order)
        db.flush()

        record_audit_event(
            db=db,
            action="PREVENTIVE_WORK_ORDER_PROPOSED",
            user_id=user.id,
            details=f"PREVENTIVE_WORK_ORDER_PROPOSED: Order #{order.id} ('{title}') for Village #{village_id}."
        )
        db.commit()
        db.refresh(order)
        return order

    def approve_preventive_work_order(
        self,
        db: Session,
        order_id: int,
        technician_id: int,
        user: User
    ) -> Dict[str, Any]:
        """Approves a Preventive Work Order and creates an active field maintenance task."""
        order = db.query(PreventiveWorkOrder).filter(PreventiveWorkOrder.id == order_id).first()
        if not order:
            raise ValueError("Preventive work order not found.")

        tech = db.query(Technician).filter(Technician.id == technician_id).first()
        if not tech:
            raise ValueError("Technician not found.")

        now = datetime.utcnow()
        order.status = "approved"
        order.approved_by = user.name
        order.approved_at = now
        order.technician_id = technician_id

        # Find or create anchor preventive incident
        inc = db.query(Incident).filter(
            Incident.village_id == order.village_id,
            Incident.category == order.category
        ).first()

        inc_id = inc.id if inc else 1

        # Create Task
        task = Task(
            incident_id=inc_id,
            technician_id=technician_id,
            description=f"[PREVENTIVE MAINTENANCE] {order.title}: {order.description}",
            status="assigned",
            assigned_at=now,
            cost=5000.0,
            base_cost=5000.0,
            payout_status="pending"
        )
        db.add(task)
        db.flush()

        order.task_id = task.id
        order.status = "in_progress"

        record_audit_event(
            db=db,
            action="PREVENTIVE_WORK_ORDER_APPROVED",
            user_id=user.id,
            details=f"PREVENTIVE_WORK_ORDER_APPROVED: Order #{order.id} approved by {user.name}. Dispatched Task #{task.id} to Technician #{technician_id}."
        )
        db.commit()
        db.refresh(order)

        return {
            "status": "success",
            "order_id": order.id,
            "task_id": task.id,
            "technician_id": technician_id,
            "approved_by": order.approved_by,
            "state": "in_progress"
        }

early_warning_service = EarlyWarningService()
