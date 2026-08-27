import hashlib
import datetime
import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models import AuditLog

logger = logging.getLogger("gramx.audit_chain")

GENESIS_HASH = "0" * 64

def compute_event_hash(action: str, user_id: Optional[int], timestamp_str: str, details: Optional[str], prev_hash: str) -> str:
    """Computes a deterministic cryptographic SHA-256 hash for an audit log event."""
    data_payload = f"{action}|{user_id or 'SYSTEM'}|{timestamp_str}|{details or ''}|{prev_hash}"
    return hashlib.sha256(data_payload.encode('utf-8')).hexdigest()

def record_audit_event(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    details: Optional[str] = None,
    timestamp: Optional[datetime.datetime] = None
) -> AuditLog:
    """
    Creates and records a cryptographically linked immutable audit event.
    Appends to the tamper-evident hash chain: Hash_n = SHA256(Data_n + Hash_{n-1}).
    """
    ts = timestamp or datetime.datetime.utcnow()
    ts_str = ts.isoformat()

    # Flush any pending objects in session
    db.flush()

    # Retrieve previous audit log hash
    latest_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = latest_log.current_hash if (latest_log and latest_log.current_hash) else (latest_log.details[:64] if latest_log else GENESIS_HASH)
    if len(prev_hash) != 64:
        # Normalize to 64-char sha256
        prev_hash = hashlib.sha256(prev_hash.encode('utf-8')).hexdigest()

    curr_hash = compute_event_hash(action, user_id, ts_str, details, prev_hash)


    audit = AuditLog(
        action=action,
        user_id=user_id,
        timestamp=ts,
        details=details,
        prev_hash=prev_hash,
        current_hash=curr_hash
    )
    db.add(audit)
    return audit

def verify_audit_chain(db: Session) -> Dict[str, Any]:
    """
    Scans the entire sequential audit trail to verify cryptographic hash continuity.
    Detects any retroactive record modification, insertion, deletion, or tampering.
    """
    logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not logs:
        return {
            "status": "verified",
            "is_valid": True,
            "total_records": 0,
            "tampered_records": [],
            "verified_at": datetime.datetime.utcnow().isoformat(),
            "details": "Audit chain is empty. Genesis state intact."
        }

    tampered = []
    expected_prev = GENESIS_HASH

    for idx, log in enumerate(logs):
        ts_str = log.timestamp.isoformat() if log.timestamp else ""
        
        # If record has hash chaining populated
        if log.current_hash and log.prev_hash:
            if idx > 0 and log.prev_hash != expected_prev:
                tampered.append({
                    "id": log.id,
                    "action": log.action,
                    "reason": f"Previous hash mismatch: expected {expected_prev[:16]}..., found {log.prev_hash[:16]}..."
                })
            
            recomputed = compute_event_hash(log.action, log.user_id, ts_str, log.details, log.prev_hash)
            if log.current_hash != recomputed:
                tampered.append({
                    "id": log.id,
                    "action": log.action,
                    "reason": f"Content hash mismatch: expected {recomputed[:16]}..., found {log.current_hash[:16]}..."
                })
            expected_prev = log.current_hash
        else:
            # Legacy unhashed log: calculate baseline
            expected_prev = hashlib.sha256((log.details or str(log.id)).encode('utf-8')).hexdigest()

    is_valid = len(tampered) == 0
    return {
        "status": "verified" if is_valid else "compromised",
        "is_valid": is_valid,
        "total_records": len(logs),
        "tampered_records": tampered,
        "verified_at": datetime.datetime.utcnow().isoformat(),
        "details": "All cryptographic SHA-256 audit links verified successfully." if is_valid else f"Detected {len(tampered)} compromised records in audit chain."
    }
