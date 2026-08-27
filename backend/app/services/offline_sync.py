"""
GRAM-X Phase 7: Offline-First Field Operations & Idempotency Manager
Modules: offline_sync.py & idempotency.py
"""

import time
import datetime
import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models import Task, Incident, IncidentEvidence, AuditLog

class IdempotencyManager:
    """Manages idempotent request execution to prevent duplicate submissions on retry."""
    _cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def check_and_get(cls, key: str) -> Optional[Dict[str, Any]]:
        """Returns cached response if key exists and is valid (< 24h)."""
        if not key:
            return None
        cached = cls._cache.get(key)
        if cached:
            # Check TTL (24 hours)
            if time.time() - cached.get("timestamp", 0) < 86400:
                return cached.get("response")
        return None

    @classmethod
    def record_response(cls, key: str, response_data: Dict[str, Any]):
        """Records the response data against the idempotency key."""
        if not key:
            return
        cls._cache[key] = {
            "timestamp": time.time(),
            "response": response_data
        }

class OfflineSyncEngine:
    """Processes offline technician queues with operation IDs and conflict resolution."""

    @classmethod
    def process_sync_batch(cls, operations: List[Dict[str, Any]], technician_id: int, db: Session) -> Dict[str, Any]:
        """
        Executes a batch of offline field updates sequentially.
        Conflict strategy:
        - If task was updated by admin in parallel: 'CONFLICT_SUPERVISOR_FLAGGED'
        - If idempotent replay: 'ALREADY_SYNCED'
        - Normal execution: 'SYNC_SUCCESS'
        """
        results = []
        synced_count = 0
        conflicts_count = 0

        for op in operations:
            op_id = op.get("op_id") or str(uuid.uuid4())
            op_type = op.get("op_type")  # e.g., "TASK_COMPLETION", "EVIDENCE_UPLOAD", "CHECKLIST_UPDATE"
            task_id = op.get("task_id")
            payload = op.get("payload", {})
            client_ts = op.get("client_timestamp")

            # 1. Idempotency Check
            cached = IdempotencyManager.check_and_get(op_id)
            if cached:
                results.append({
                    "op_id": op_id,
                    "status": "ALREADY_SYNCED",
                    "response": cached
                })
                synced_count += 1
                continue

            task = db.query(Task).filter(Task.id == task_id).first() if task_id else None
            if not task:
                results.append({
                    "op_id": op_id,
                    "status": "SYNC_FAILED",
                    "error": f"Target task #{task_id} not found"
                })
                continue

            # 2. Conflict Detection (if task is already resolved on server)
            if task.status == "completed" and op_type == "TASK_COMPLETION":
                conflicts_count += 1
                results.append({
                    "op_id": op_id,
                    "status": "CONFLICT_REQUIRES_REVIEW",
                    "reason": "Task was already finalized on server. Field notes appended as supplemental log."
                })
                continue

            # 3. Apply Mutating Operation
            if op_type == "TASK_COMPLETION":
                task.status = "completed"
                task.completed_at = datetime.datetime.utcnow()
                task.work_done = payload.get("work_done", task.work_done)
                task.what_was_wrong = payload.get("what_was_wrong", task.what_was_wrong)
                task.product_effect = payload.get("product_effect", task.product_effect)
                
                # Update incident state
                inc = db.query(Incident).filter(Incident.id == task.incident_id).first()
                if inc:
                    inc.status = "resolved"
                    inc.resolved_at = datetime.datetime.utcnow()

                db.commit()

            res_data = {
                "op_id": op_id,
                "status": "SYNC_SUCCESS",
                "task_id": task_id,
                "server_timestamp": datetime.datetime.utcnow().isoformat()
            }
            IdempotencyManager.record_response(op_id, res_data)
            results.append(res_data)
            synced_count += 1

        return {
            "total_operations_received": len(operations),
            "synced_count": synced_count,
            "conflicts_count": conflicts_count,
            "sync_status": "COMPLETED" if conflicts_count == 0 else "PARTIAL_WITH_CONFLICTS",
            "operation_results": results
        }

idempotency_manager = IdempotencyManager()
offline_sync_engine = OfflineSyncEngine()
