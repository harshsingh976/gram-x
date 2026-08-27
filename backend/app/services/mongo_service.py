"""
GRAM-X MongoDB Service Layer
Dedicated document store for:
1. Dynamic inspection records (varying fields across water, road, solar, civil works)
2. Dynamic form payloads (custom department survey fields)
3. Rich evidence metadata (EXIF telemetry, voice waveform data)

Rule: SQL remains the authoritative system of record for task status, approvals, and financial transactions.
Resilience: Gracefully falls back to local document store if MongoDB is offline.
"""

import json
import logging
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from app.config import MONGODB_URI, MONGODB_DB_NAME

logger = logging.getLogger("gramx.mongodb")

class MongoService:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_connected = False
        self._local_fallback_store: Dict[str, List[Dict[str, Any]]] = {
            "inspection_records": [],
            "dynamic_form_payloads": [],
            "evidence_metadata_extended": []
        }
        self._init_connection()

    def _init_connection(self):
        try:
            import pymongo
            self.client = pymongo.MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=1500,
                connectTimeoutMS=1500
            )
            # Trigger server selection test
            self.client.admin.command('ping')
            self.db = self.client[MONGODB_DB_NAME]
            self.is_connected = True
            logger.info("Connected to MongoDB document database successfully.")
        except Exception as e:
            self.is_connected = False
            self.client = None
            self.db = None
            logger.info(f"MongoDB not reachable ({e}). Using resilient in-process JSON document fallback.")

    def health_check(self) -> Dict[str, Any]:
        """Returns the health status of the MongoDB document layer."""
        if self.is_connected and self.client:
            try:
                self.client.admin.command('ping')
                return {
                    "status": "healthy",
                    "mode": "mongodb_cluster",
                    "database": MONGODB_DB_NAME,
                    "collections": ["inspection_records", "dynamic_form_payloads", "evidence_metadata_extended"]
                }
            except Exception as e:
                self.is_connected = False
                return {"status": "degraded", "mode": "resilient_fallback", "error": str(e)}
        return {
            "status": "healthy",
            "mode": "resilient_fallback",
            "note": "Operating in zero-dependency document store mode",
            "document_counts": {k: len(v) for k, v in self._local_fallback_store.items()}
        }

    # ─────────────────────────────────────────────────────────────
    # INSPECTION RECORDS (Dynamic schema per department/service)
    # ─────────────────────────────────────────────────────────────
    def save_inspection_record(self, data: Dict[str, Any]) -> Dict[str, Any]:
        doc = dict(data)
        if "_id" not in doc and "id" not in doc:
            doc["_id"] = f"insp_{uuid.uuid4().hex[:12]}"
        doc_id = doc.get("_id") or doc.get("id")
        doc["id"] = doc_id
        if "created_at" not in doc:
            doc["created_at"] = datetime.utcnow().isoformat()

        if self.is_connected and self.db is not None:
            try:
                self.db.inspection_records.insert_one(doc)
                doc["_id"] = str(doc["_id"])
                return doc
            except Exception as e:
                logger.warning(f"MongoDB write failed, falling back to local doc store: {e}")

        # Local fallback
        self._local_fallback_store["inspection_records"].append(doc)
        return doc

    def get_inspection_records(
        self,
        incident_id: Optional[int] = None,
        task_id: Optional[int] = None,
        asset_id: Optional[int] = None,
        service_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                query: Dict[str, Any] = {}
                if incident_id:
                    query["incident_id"] = incident_id
                if task_id:
                    query["task_id"] = task_id
                if asset_id:
                    query["asset_id"] = asset_id
                if service_type:
                    query["service_type"] = service_type

                results = list(self.db.inspection_records.find(query).sort("created_at", -1))
                for r in results:
                    r["id"] = str(r.get("_id", r.get("id", "")))
                    if "_id" in r:
                        del r["_id"]
                return results
            except Exception as e:
                logger.warning(f"MongoDB query failed: {e}")

        # Fallback filter
        results = []
        for r in reversed(self._local_fallback_store["inspection_records"]):
            if incident_id and r.get("incident_id") != incident_id:
                continue
            if task_id and r.get("task_id") != task_id:
                continue
            if asset_id and r.get("asset_id") != asset_id:
                continue
            if service_type and r.get("service_type") != service_type:
                continue
            results.append(r)
        return results

    # ─────────────────────────────────────────────────────────────
    # DYNAMIC FORM PAYLOADS (Custom grievance surveys)
    # ─────────────────────────────────────────────────────────────
    def save_dynamic_form_payload(self, form_type: str, resource_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
        doc = {
            "id": f"form_{uuid.uuid4().hex[:12]}",
            "form_type": form_type,
            "resource_id": resource_id,
            "payload": payload,
            "created_at": datetime.utcnow().isoformat()
        }
        if self.is_connected and self.db is not None:
            try:
                self.db.dynamic_form_payloads.insert_one(doc)
                if "_id" in doc:
                    del doc["_id"]
                return doc
            except Exception as e:
                logger.warning(f"MongoDB write failed: {e}")

        self._local_fallback_store["dynamic_form_payloads"].append(doc)
        return doc

    # ─────────────────────────────────────────────────────────────
    # EVIDENCE METADATA EXTENDED (EXIF telemetry, voice waveforms)
    # ─────────────────────────────────────────────────────────────
    def save_extended_evidence_metadata(self, evidence_id: int, metadata: Dict[str, Any]) -> Dict[str, Any]:
        doc = {
            "id": f"meta_{uuid.uuid4().hex[:12]}",
            "evidence_id": evidence_id,
            "metadata": metadata,
            "created_at": datetime.utcnow().isoformat()
        }
        if self.is_connected and self.db is not None:
            try:
                self.db.evidence_metadata_extended.insert_one(doc)
                if "_id" in doc:
                    del doc["_id"]
                return doc
            except Exception as e:
                logger.warning(f"MongoDB write failed: {e}")

        self._local_fallback_store["evidence_metadata_extended"].append(doc)
        return doc


# Global singleton instance
mongo_service = MongoService()
