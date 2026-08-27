# GRAM-X DISASTER RECOVERY & BUSINESS CONTINUITY PLAN (DRP)
**Document Version:** 2.0 (Enterprise Production Cloud Edition)  
**System Classification:** Tier-1 Critical Public Infrastructure Governance Network  
**Authority:** Gram Panchayat Digital Governance Directorate • Government of Madhya Pradesh  

---

## 1. Executive Summary & Recovery Objectives
The GRAM-X platform manages grassroots citizen grievances, public infrastructure assets, field technician deployments, and cryptographic audit records across gram panchayats and district administrations. 

- **Recovery Point Objective (RPO):** $\le$ 5 minutes (via Transactional Outbox + Render Managed PostgreSQL continuous WAL archiving).
- **Recovery Time Objective (RTO):** $\le$ 15 minutes for primary web API and $\le$ 30 minutes for multi-region failover.

---

## 2. Infrastructure Architecture & Failure Boundaries

```
                 ┌──────────────────────────────────────────────┐
                 │       CLOUDFLARE EDGE / HTTPS WSS ROUTER     │
                 └──────────────────────┬───────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
       [GRAM-X FRONTEND SPA]                     [GRAM-X FASTAPI SERVICE]
       Vite React Static Site                    Python 3.11 Web Service
                    │                                       │
                    │               ┌───────────────────────┼───────────────────────┐
                    │               ▼                       ▼                       ▼
                    │       [MANAGED POSTGRESQL]    [CLOUD OBJECT STORAGE]   [AI / STT ENGINES]
                    │       Automated Daily Backup  S3 / Cloudflare R2       Whisper / Llama 3.3
                    │       + Continuous WAL        Multi-AZ Replication     Graceful Fallback
                    │               │
                    └───────────────┴───────────────────────┐
                                                            ▼
                                                [OFFLINE INDEXEDDB QUEUE]
                                                Local Store-and-Forward on Mobile
```

---

## 3. Disaster Scenarios & Recovery Procedures

### Scenario A: Database Outage or Data Corruption
1. **Detection:** `/readiness` probe returns `503 Service Unavailable` with `database: UNHEALTHY`.
2. **Immediate Action:**
   - Put web service into read-only degraded mode via `APP_ENV_DEGRADED=true`.
   - Field workers automatically switch to IndexedDB store-and-forward mode.
3. **Restoration:**
   - Execute point-in-time recovery (PITR) in Render Dashboard or restore latest automated daily snapshot.
   - Run database schema migration: `alembic upgrade head` or `apply_schema_migrations()`.
   - Re-verify SHA-256 cryptographic audit chain continuity via `verify_audit_chain()`.
   - Trigger Transactional Outbox reconciler to resume event dispatching.

### Scenario B: Cloud Object Storage Failure (S3 / R2 / MinIO)
1. **Detection:** Storage probe fails; file upload returns `502 Bad Gateway`.
2. **Procedure:**
   - Fast-fail to secondary bucket or local disk fallback buffer (`/var/data/gramx_media_buffer`).
   - Client stores captured images/voice notes locally in IndexedDB.
   - Once cloud storage resumes, background worker streams buffered media and validates SHA-256 byte parity.

### Scenario C: External AI / STT Provider Outage (Whisper / Llama)
1. **Detection:** Speech-to-text or classification API call times out (>10s).
2. **Procedure:**
   - System automatically degrades gracefully to regional Indic rule-based classification.
   - Voice audio recording is preserved intact in cloud storage.
   - Original audio remains authoritative for audit and manual administrative review.

### Scenario D: Network Disconnection / Field Worker Inaccessibility
1. **Detection:** Device drops connection to 0 bars / airplane mode.
2. **Procedure:**
   - IndexedDB store-and-forward queue intercepts all task starts, photo captures, and completion debriefs.
   - Upon network restoration, client transmits batch payload to `POST /api/offline/sync-batch`.
   - Server returns reconciliation timestamp and logs SHA-256 audit events.

---

## 4. Cryptographic Verification Post-Recovery
Every recovery procedure MUST conclude with an automated audit chain integrity check:
```python
from app.database import SessionLocal
from app.services.audit_chain import verify_audit_chain

db = SessionLocal()
result = verify_audit_chain(db)
if not result["is_valid"]:
    raise SystemError(f"Audit chain compromised at block {result.get('broken_at')}")
print("100% SHA-256 Audit Integrity Verified.")
```

---
*Maintained by the GRAM-X Operations & Platform Security Team.*
