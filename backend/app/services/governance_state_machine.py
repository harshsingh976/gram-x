"""
GRAM-X Formal Governance State Machine & Workflow Engine (Phase 51)
Enforces authoritative complaint and task lifecycles:
SUBMITTED -> TRIAGED -> ASSIGNED -> ACCEPTED -> DISPATCHED -> IN_PROGRESS -> 
EVIDENCE_SUBMITTED -> UNDER_VERIFICATION -> VERIFIED -> RESOLVED (with ESCALATED, REJECTED, REOPENED branches).
Guarantees atomic transitions, role authorization, tamper-evident SHA-256 audit logs,
outbox event persistence, and targeted notifications.
"""

import datetime
import json
import logging
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Incident, Task, Technician, User, Notification, IncidentEvidence
from app.services.audit_chain import record_audit_event
from app.services.outbox_service import outbox_service

logger = logging.getLogger("gramx.governance")

class GovernanceState:
    SUBMITTED = "SUBMITTED"
    TRIAGED = "TRIAGED"
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    DISPATCHED = "DISPATCHED"
    IN_PROGRESS = "IN_PROGRESS"
    EVIDENCE_SUBMITTED = "EVIDENCE_SUBMITTED"
    UNDER_VERIFICATION = "UNDER_VERIFICATION"
    VERIFIED = "VERIFIED"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    ESCALATED = "ESCALATED"
    REOPENED = "REOPENED"

class GovernanceStateMachine:
    """
    Authoritative state machine governing complaint & task transitions.
    Prevents unauthorized state jumps and enforces actor capabilities.
    """

    VALID_TRANSITIONS: Dict[str, List[str]] = {
        GovernanceState.SUBMITTED: [
            GovernanceState.TRIAGED,
            GovernanceState.ASSIGNED,
            GovernanceState.REJECTED,
            GovernanceState.ESCALATED,
        ],
        GovernanceState.TRIAGED: [
            GovernanceState.ASSIGNED,
            GovernanceState.DISPATCHED,
            GovernanceState.REJECTED,
            GovernanceState.ESCALATED,
        ],
        GovernanceState.ASSIGNED: [
            GovernanceState.ACCEPTED,
            GovernanceState.DISPATCHED,
            "DECLINED",
            GovernanceState.REJECTED,
            GovernanceState.ESCALATED,
        ],
        GovernanceState.ACCEPTED: [
            GovernanceState.DISPATCHED,
            GovernanceState.IN_PROGRESS,
            GovernanceState.ESCALATED,
        ],
        GovernanceState.DISPATCHED: [
            GovernanceState.IN_PROGRESS,
            GovernanceState.ESCALATED,
        ],
        GovernanceState.IN_PROGRESS: [
            GovernanceState.EVIDENCE_SUBMITTED,
            GovernanceState.UNDER_VERIFICATION,
            GovernanceState.ESCALATED,
        ],
        GovernanceState.EVIDENCE_SUBMITTED: [
            GovernanceState.UNDER_VERIFICATION,
            GovernanceState.VERIFIED,
            GovernanceState.IN_PROGRESS,  # Request more evidence
            GovernanceState.REJECTED,
        ],
        GovernanceState.UNDER_VERIFICATION: [
            GovernanceState.VERIFIED,
            GovernanceState.IN_PROGRESS,  # Request more evidence
            GovernanceState.REJECTED,
        ],
        GovernanceState.VERIFIED: [
            GovernanceState.RESOLVED,
        ],
        GovernanceState.RESOLVED: [
            GovernanceState.REOPENED,
        ],
        GovernanceState.REJECTED: [
            GovernanceState.REOPENED,
            GovernanceState.TRIAGED,
        ],
        GovernanceState.ESCALATED: [
            GovernanceState.TRIAGED,
            GovernanceState.ASSIGNED,
            GovernanceState.DISPATCHED,
            GovernanceState.RESOLVED,
        ],
        GovernanceState.REOPENED: [
            GovernanceState.TRIAGED,
            GovernanceState.ASSIGNED,
        ]
    }

    # Role permission matrix
    ROLE_PERMISSIONS: Dict[str, List[str]] = {
        GovernanceState.TRIAGED: ["admin", "super_admin", "district"],
        GovernanceState.ASSIGNED: ["admin", "super_admin", "district"],
        GovernanceState.ACCEPTED: ["worker", "admin", "super_admin"],
        "DECLINED": ["worker", "admin"],
        GovernanceState.DISPATCHED: ["admin", "super_admin", "district"],
        GovernanceState.IN_PROGRESS: ["worker", "admin", "super_admin"],
        GovernanceState.EVIDENCE_SUBMITTED: ["worker", "admin", "super_admin"],
        GovernanceState.UNDER_VERIFICATION: ["worker", "admin", "super_admin"],
        GovernanceState.VERIFIED: ["admin", "super_admin", "district"],
        GovernanceState.RESOLVED: ["admin", "super_admin", "district", "system"],
        GovernanceState.REJECTED: ["admin", "super_admin", "district"],
        GovernanceState.ESCALATED: ["admin", "super_admin", "district", "system"],
        GovernanceState.REOPENED: ["citizen", "admin", "super_admin"],
    }

    @classmethod
    def normalize_state(cls, state_str: Optional[str]) -> str:
        """Normalizes legacy and incoming state strings to canonical uppercase format."""
        if not state_str:
            return GovernanceState.SUBMITTED
        s = state_str.strip().upper().replace(" ", "_")
        # Legacy mapping
        mapping = {
            "PENDING_VERIFICATION": GovernanceState.SUBMITTED,
            "PENDING": GovernanceState.SUBMITTED,
            "IN_PROGRESS": GovernanceState.IN_PROGRESS,
            "VERIFIED": GovernanceState.VERIFIED,
            "RESOLVED": GovernanceState.RESOLVED,
            "RESOLVED_CONFIRMED": GovernanceState.RESOLVED,
            "OUTCOME_GAP": GovernanceState.ESCALATED,
        }
        return mapping.get(s, s)

    @classmethod
    def validate_transition(cls, current_state: str, target_state: str, user_role: str) -> None:
        """
        Validates state machine transition rules and actor permissions.
        Raises HTTPException with 400 Bad Request or 403 Forbidden on violation.
        """
        curr = cls.normalize_state(current_state)
        target = cls.normalize_state(target_state)

        # 1. Check if transition is defined in the graph
        valid_next_states = cls.VALID_TRANSITIONS.get(curr, [])
        if target not in valid_next_states and curr != target:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid governance state transition from '{curr}' to '{target}'. Permitted next states: {valid_next_states}"
            )

        # 2. Check if actor has permission for target state
        allowed_roles = cls.ROLE_PERMISSIONS.get(target, ["admin", "super_admin"])
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Actor with role '{user_role}' is not authorized to transition state to '{target}'. Required roles: {allowed_roles}"
            )

    @classmethod
    def transition_incident(
        cls,
        db: Session,
        incident_id: int,
        target_state: str,
        actor: User,
        remarks: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> Incident:
        """
        Executes a complete atomic governance transition on an incident.
        Updates state, actor metadata, timestamps, audit chain, notifications, and outbox events.
        """
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise HTTPException(status_code=404, detail=f"Incident #{incident_id} not found.")

        current_norm = cls.normalize_state(incident.status)
        target_norm = cls.normalize_state(target_state)

        # Validate transition & role
        cls.validate_transition(current_norm, target_norm, actor.role)

        now = datetime.datetime.utcnow()
        server_ts_str = now.isoformat()

        # Update Incident model
        incident.status = target_norm.lower()

        extra_audit_details = remarks or ""
        event_name = f"INCIDENT_{target_norm}"

        if target_norm == GovernanceState.TRIAGED:
            if additional_data:
                if "category" in additional_data:
                    incident.category = additional_data["category"]
                if "severity" in additional_data:
                    incident.severity = additional_data["severity"]
                if "priority_score" in additional_data:
                    incident.priority_score = float(additional_data["priority_score"])
            extra_audit_details = f"Triaged by {actor.name} ({actor.role}). Official Category: {incident.category}, Priority: {incident.severity}."

        elif target_norm == GovernanceState.DISPATCHED:
            extra_audit_details = f"Dispatched by {actor.name} ({actor.role}) on {now.strftime('%d/%m/%Y at %I:%M %p')}. Remarks: {remarks or 'Field work dispatched'}."

        elif target_norm == GovernanceState.IN_PROGRESS:
            extra_audit_details = f"Work started on-site by {actor.name} ({actor.role})."

        elif target_norm in [GovernanceState.EVIDENCE_SUBMITTED, GovernanceState.UNDER_VERIFICATION]:
            extra_audit_details = f"Field resolution evidence submitted by {actor.name}. Pending administrative verification."

        elif target_norm == GovernanceState.VERIFIED:
            incident.resolved_at = now
            extra_audit_details = f"Resolution verified by {actor.name} ({actor.role}). Remarks: {remarks or 'Quality standards verified'}."

        elif target_norm == GovernanceState.RESOLVED:
            incident.resolved_at = now
            extra_audit_details = f"Complaint closed and officially resolved by {actor.name} ({actor.role})."

        elif target_norm == GovernanceState.REJECTED:
            extra_audit_details = f"Complaint rejected by {actor.name}. Reason: {remarks or 'Did not meet criteria'}."

        elif target_norm == GovernanceState.ESCALATED:
            extra_audit_details = f"Escalated to District Collector by {actor.name}. Reason: {remarks or 'SLA breach / Complexity'}."

        elif target_norm == GovernanceState.REOPENED:
            incident.resolved_at = None
            extra_audit_details = f"Complaint reopened by {actor.name}. Reason: {remarks or 'Issue reoccurred'}."

        # 1. Cryptographic SHA-256 Audit Log Record
        audit = record_audit_event(
            db=db,
            action=event_name,
            user_id=actor.id,
            details=f"GOVERNANCE_TRANSITION: Incident #{incident.id} [{current_norm} -> {target_norm}]. {extra_audit_details}"
        )

        # 2. Transactional Outbox Event for WebSockets
        outbox_payload = {
            "incident_id": incident.id,
            "title": incident.title,
            "category": incident.category,
            "severity": incident.severity,
            "previous_state": current_norm,
            "current_state": target_norm,
            "actor_id": actor.id,
            "actor_name": actor.name,
            "actor_role": actor.role,
            "timestamp": server_ts_str,
            "remarks": remarks
        }

        # Target channels based on transition
        outbox_service.record_event(
            db=db,
            event_type=event_name,
            channel="broadcast",
            payload=outbox_payload,
            target_user_id=incident.reporter_id
        )

        # 3. Persistent Notifications for stakeholders
        cls._create_transition_notifications(db, incident, current_norm, target_norm, actor, remarks)

        db.commit()
        db.refresh(incident)

        logger.info(f"Governance transition completed: Incident #{incident.id} -> {target_norm} by {actor.name}")
        return incident

    @classmethod
    def _create_transition_notifications(
        cls,
        db: Session,
        incident: Incident,
        previous_state: str,
        current_state: str,
        actor: User,
        remarks: Optional[str]
    ) -> None:
        """Dispatches persistent stakeholder notifications for governance state changes."""
        now = datetime.datetime.utcnow()

        # Messages by transition
        citizen_msg = None
        admin_msg = None
        worker_msg = None
        collector_msg = None

        if current_state == GovernanceState.TRIAGED:
            citizen_msg = f"Your grievance INC-{incident.id} ('{incident.title}') has been triaged and prioritized as {incident.severity.upper()}."
            admin_msg = f"Grievance INC-{incident.id} has been triaged by {actor.name}."

        elif current_state == GovernanceState.ASSIGNED:
            citizen_msg = f"Your grievance INC-{incident.id} has been assigned to a field worker for resolution."
            worker_msg = f"New task assigned: INC-{incident.id} ('{incident.title}'). Please review and accept."

        elif current_state == GovernanceState.DISPATCHED:
            citizen_msg = f"Field technician has been dispatched to your location for INC-{incident.id}."
            worker_msg = f"Official dispatch approved for INC-{incident.id}. You may proceed to the site."

        elif current_state == GovernanceState.IN_PROGRESS:
            citizen_msg = f"Field work is currently in progress for INC-{incident.id}."
            admin_msg = f"Worker {actor.name} has started work on INC-{incident.id}."

        elif current_state in [GovernanceState.EVIDENCE_SUBMITTED, GovernanceState.UNDER_VERIFICATION]:
            citizen_msg = f"Resolution evidence has been submitted for INC-{incident.id}. Awaiting administrative verification."
            admin_msg = f"Action Required: Worker {actor.name} submitted resolution evidence for INC-{incident.id}. Please verify."

        elif current_state == GovernanceState.VERIFIED or current_state == GovernanceState.RESOLVED:
            citizen_msg = f"✅ Your grievance INC-{incident.id} ('{incident.title}') has been successfully verified and RESOLVED!"
            worker_msg = f"Task for INC-{incident.id} has been verified and marked completed. Payout queued."
            collector_msg = f"Grievance INC-{incident.id} resolved in Village #{incident.village_id}."

        elif current_state == GovernanceState.REJECTED:
            citizen_msg = f"Your grievance INC-{incident.id} was reviewed and rejected. Reason: {remarks or 'N/A'}."

        elif current_state == GovernanceState.ESCALATED:
            collector_msg = f"🚨 Escalation Alert: Grievance INC-{incident.id} escalated to District Level. Reason: {remarks or 'SLA Breach'}."
            admin_msg = f"Grievance INC-{incident.id} escalated to District Collector."

        # Insert persistent notifications
        if citizen_msg and incident.reporter_id:
            db.add(Notification(
                recipient_id=incident.reporter_id,
                recipient_role="citizen",
                event_type=f"GOV_{current_state}",
                severity="info" if current_state != GovernanceState.REJECTED else "warning",
                message=citizen_msg,
                reference_type="incident",
                reference_id=incident.id,
                created_at=now
            ))

        if admin_msg:
            db.add(Notification(
                recipient_role="admin",
                event_type=f"GOV_{current_state}",
                severity="info",
                message=admin_msg,
                reference_type="incident",
                reference_id=incident.id,
                created_at=now
            ))

        if worker_msg:
            # Find assigned worker
            task = db.query(Task).filter(Task.incident_id == incident.id).first()
            tech_user_id = None
            if task:
                tech = db.query(Technician).filter(Technician.id == task.technician_id).first()
                if tech:
                    tech_user_id = tech.user_id

            db.add(Notification(
                recipient_id=tech_user_id,
                recipient_role="worker",
                event_type=f"GOV_{current_state}",
                severity="info",
                message=worker_msg,
                reference_type="task" if task else "incident",
                reference_id=task.id if task else incident.id,
                created_at=now
            ))

        if collector_msg:
            db.add(Notification(
                recipient_role="district",
                event_type=f"GOV_{current_state}",
                severity="critical" if "Escalation" in collector_msg else "info",
                message=collector_msg,
                reference_type="incident",
                reference_id=incident.id,
                created_at=now
            ))

governance_state_machine = GovernanceStateMachine()
