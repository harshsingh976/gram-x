"""
GRAM-X Phase 7: Department Accountability Contest & Override Engine
Module: governance_contest.py
"""

import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import Incident, User, AuditLog

class DepartmentContestEngine:
    """Provides substantiated contest/override workflows for accountability risk signals."""
    _contests: List[Dict[str, Any]] = []

    @classmethod
    def submit_contest(
        cls,
        incident_id: int,
        flag_type: str,
        justification: str,
        user: User,
        db: Session
    ) -> Dict[str, Any]:
        """Submits a substantiated departmental contest against an AI accountability signal."""
        contest_entry = {
            "contest_id": f"CONT-{len(cls._contests)+1:04d}",
            "incident_id": incident_id,
            "flag_type": flag_type,
            "justification": justification,
            "contested_by": user.name or user.username,
            "contested_by_role": user.role,
            "status": "UNDER_DISTRICT_REVIEW",
            "submitted_at": datetime.datetime.utcnow().isoformat(),
            "review_decision": None
        }
        cls._contests.append(contest_entry)

        # Record in Immutable Audit Log
        audit = AuditLog(
            user_id=user.id,
            action="ACCOUNTABILITY_SIGNAL_CONTESTED",
            details=f"Incident #{incident_id} | Flag: {flag_type} | Reason: {justification[:100]}"
        )
        db.add(audit)
        db.commit()

        return {
            "status": "CONTEST_SUBMITTED",
            "contest": contest_entry,
            "message": "Contest recorded in audit trail and forwarded to District Collector desk for review."
        }

    @classmethod
    def list_pending_contests(cls) -> List[Dict[str, Any]]:
        """Returns all contests awaiting district determination."""
        return cls._contests

governance_contest_engine = DepartmentContestEngine()
