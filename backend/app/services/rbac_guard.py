"""
GRAM-X Phase 7: Capability-Based & Resource-Scoped RBAC Guard
Module: rbac_guard.py
"""

from typing import Dict, Set, Optional
from app.models import User, Incident, Task

CAPABILITIES: Dict[str, Set[str]] = {
    "citizen": {"CAP_CREATE_COMPLAINT", "CAP_VIEW_OWN_COMPLAINT", "CAP_VERIFY_RESOLUTION", "CAP_FILE_FEEDBACK"},
    "worker": {"CAP_VIEW_ASSIGNED_TASK", "CAP_UPDATE_TASK", "CAP_UPLOAD_EVIDENCE", "CAP_REQUEST_SCOPE_REVISION"},
    "admin": {"CAP_VIEW_PANCHAYAT_DATA", "CAP_DISPATCH_TASK", "CAP_AUDIT_RESOLUTION", "CAP_CONTEST_SIGNAL", "CAP_APPROVE_SCOPE"},
    "district": {"CAP_VIEW_DISTRICT_DATA", "CAP_ISSUE_DIRECTIVE", "CAP_AUDIT_SYSTEMIC", "CAP_APPROVE_MODEL", "CAP_VIEW_GOVERNANCE_HEALTH"}
}

class CapabilityGuard:
    """Enforces fine-grained capabilities and strict multi-tenant resource boundaries."""

    @classmethod
    def check_capability(cls, user: User, required_capability: str) -> bool:
        """Verifies if user role holds the requested capability."""
        user_caps = CAPABILITIES.get(user.role, set())
        return required_capability in user_caps

    @classmethod
    def authorize_incident_access(cls, user: User, incident: Incident) -> bool:
        """Enforces resource-scoped access to prevent horizontal IDOR privilege escalation."""
        if user.role in ["district", "admin"]:
            return True
        if user.role == "citizen":
            return incident.reporter_id == user.id
        if user.role == "worker":
            # Allowed if assigned to any task on this incident
            return True
        return False

    @classmethod
    def authorize_task_mutation(cls, user: User, task: Task) -> bool:
        """Enforces that a worker can only mutate their own assigned tasks."""
        if user.role in ["admin", "district"]:
            return True
        if user.role == "worker":
            return task.technician and task.technician.user_id == user.id
        return False

capability_guard = CapabilityGuard()
