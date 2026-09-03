# GRAM-X — Production Rollback Strategy & Runbook (Phase 7)

## 1. Overview & Rollback Principles

In the event that an unexpected bug, critical performance regression, or security vulnerability is detected in production, this runbook outlines the zero-downtime rollback procedure.

**Core Rules**:
1. All database migrations must be **additive and backward-compatible** (expand-and-contract pattern).
2. Frontend code must support both `Schema Version N` and `Schema Version N-1`.
3. Vercel deployments are immutable and can be rolled back with one click in `< 30 seconds`.

---

## 2. Frontend Rollback Procedure (Vercel)

### Instant One-Click Rollback:
1. Navigate to **Vercel Dashboard -> Project: `gram-x` -> Deployments**.
2. Identify the last known healthy deployment commit hash.
3. Click the **`...` (More Options)** icon next to that deployment and select **Promote to Production**.
4. Traffic is instantly routed to the previous build without rebuilding.

### CLI Rollback:
```bash
# Rollback via Vercel CLI
vercel rollback <deployment-id-or-url>
```

---

## 3. Database Migration Rollback Strategy

Never execute destructive `DROP TABLE` or `DROP COLUMN` in production migrations during an active release. Follow the 2-phase migration strategy:

### Backward-Compatible Rollback Guidelines:
- If a new index or RPC function introduces unexpected load:
  ```sql
  -- Safe index rollback
  drop index concurrently if exists public.idx_problematic_index;
  ```
- If a new column was added:
  - Keep the column intact. Revert the frontend code to ignore the column.
  - Schedule cleanup in the next release cycle once all replicas have transitioned.

---

## 4. Feature Flag & Emergency Circuit Breakers

Use `frontend/src/services/featureFlags.ts` to disable faulty subsystems instantly without full deployments:

| Subsystem | Emergency Action | Effect |
|-----------|------------------|--------|
| **AI Triage / OCR** | Disable `FEATURE_AI_TRIAGE` | System falls back to rule-based manual classification |
| **Realtime WebSockets** | Disable `FEATURE_REALTIME` | System falls back to polling / standard REST queries |
| **Voice / Speech** | Disable `FEATURE_VOICE_GATEWAY` | Voice input button hides, standard form remains active |
| **Map Clustering** | Disable `FEATURE_MAP_CLUSTERS` | Map renders standard simple pins |

---

## 5. Post-Rollback Incident Review (Post-Mortem)
1. Export Sentry error logs and Cloudflare edge metrics from incident window.
2. Verify all user transactions submitted during the incident window are accounted for in `idempotency_keys` and `audit_logs`.
3. Complete root-cause analysis (RCA) within 24 hours of incident mitigation.
