"""
GRAM-X Enterprise Notification Outbox & Event Dispatcher
Guarantees reliable asynchronous delivery of governance events (Complaints, Task Dispatches, SLA Alerts).
Events are written atomically in the SQL transaction, then dispatched to active WebSocket clients.
"""

import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import OutboxEvent
from app.services.realtime_manager import realtime_manager

logger = logging.getLogger("gramx.outbox")

class OutboxService:
    """Manages transactional recording and asynchronous dispatch of events."""

    def record_event(
        self,
        db: Session,
        event_type: str,
        channel: str,
        payload: Dict[str, Any],
        target_user_id: Optional[int] = None
    ) -> OutboxEvent:
        """
        Records an event atomically into the database outbox table.
        Must be called within an active database transaction before commit.
        """
        if target_user_id and "target_user_id" not in payload:
            payload["target_user_id"] = target_user_id

        outbox_row = OutboxEvent(
            event_type=event_type,
            channel=channel,
            payload_json=json.dumps(payload, default=str),
            status="pending",
            created_at=datetime.utcnow()
        )
        db.add(outbox_row)
        return outbox_row


    async def dispatch_event_now(self, event_type: str, channel: str, payload: Dict[str, Any]):
        """Directly broadcasts event to connected WebSocket clients."""
        try:
            await realtime_manager.broadcast_to_channel(channel, event_type, payload)
        except Exception as e:
            logger.error(f"Failed to dispatch real-time event '{event_type}' on channel '{channel}': {e}")

    async def process_pending_outbox_events(self, db: Session, limit: int = 20):
        """Processes and clears pending outbox events asynchronously."""
        try:
            pending = db.query(OutboxEvent).filter(
                OutboxEvent.status == "pending"
            ).order_by(OutboxEvent.id.asc()).limit(limit).all()

            for item in pending:
                try:
                    payload = json.loads(item.payload_json)
                    await realtime_manager.broadcast_to_channel(item.channel, item.event_type, payload)
                    item.status = "processed"
                    item.processed_at = datetime.utcnow()
                except Exception as e:
                    item.retry_count += 1
                    if item.retry_count >= 5:
                        item.status = "failed"
                    logger.error(f"Failed processing outbox event #{item.id}: {e}")
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Outbox worker transaction error: {e}")


# Global singleton instance
outbox_service = OutboxService()
