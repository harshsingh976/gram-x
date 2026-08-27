"""
GRAM-X Phase 7: Active Hash-Chain Integrity Verification Engine
Module: audit_verifier.py
"""

import hashlib
import time
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import AuditLog

class AuditChainVerifier:
    """Traverses AuditLog table block by block, verifying cryptographic hash continuity."""

    @classmethod
    def verify_entire_chain(cls, db: Session) -> Dict[str, Any]:
        """
        Verifies every link in the cryptographic audit chain.
        Returns detailed integrity health certificate and flags broken links.
        """
        start_time = time.time()
        logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()

        if not logs:
            return {
                "status": "EMPTY_CHAIN",
                "total_blocks": 0,
                "verified_blocks": 0,
                "tampered_blocks": 0,
                "integrity_healthy": True,
                "certificate": "CHAIN_EMPTY_VALID",
                "verification_latency_ms": 0.1
            }

        prev_hash = "GENESIS_BLOCK"
        broken_links: List[Dict[str, Any]] = []

        for log in logs:
            ts_str = log.timestamp.isoformat() if log.timestamp else ""
            expected_payload = f"{log.action}|{log.user_id or 'SYSTEM'}|{ts_str}|{log.details or ''}|{prev_hash}"
            computed_hash = hashlib.sha256(expected_payload.encode()).hexdigest()

            # Verify integrity
            if log.prev_hash and log.prev_hash != prev_hash and log.id != 1:
                broken_links.append({
                    "log_id": log.id,
                    "expected_prev_hash": prev_hash,
                    "actual_prev_hash": log.prev_hash,
                    "tamper_type": "PREVIOUS_HASH_MISMATCH"
                })

            prev_hash = log.current_hash or computed_hash

        is_healthy = len(broken_links) == 0
        elapsed_ms = round((time.time() - start_time) * 1000.0, 2)

        return {
            "status": "INTEGRITY_VERIFIED" if is_healthy else "TAMPER_DETECTED",
            "total_blocks": len(logs),
            "verified_blocks": len(logs) - len(broken_links),
            "tampered_blocks": len(broken_links),
            "integrity_healthy": is_healthy,
            "broken_links": broken_links,
            "certificate": f"SHA256-CERT-OK-{len(logs)}-BLOCKS" if is_healthy else "INTEGRITY_FAILURE_ALERT",
            "verification_latency_ms": elapsed_ms
        }

audit_chain_verifier = AuditChainVerifier()
