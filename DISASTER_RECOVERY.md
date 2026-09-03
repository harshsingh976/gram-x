# GRAM-X — Disaster Recovery & Business Continuity Plan (Phase 7)

## 1. Recovery Objectives (RPO & RTO)

| Service Layer | Recovery Point Objective (RPO) | Recovery Time Objective (RTO) | Strategy |
|---------------|--------------------------------|-------------------------------|----------|
| **Supabase Database** | < 1 minute (WAL Stream) | < 15 minutes | Automated Multi-AZ Point-in-Time Recovery |
| **Object Storage (R2)** | 0 seconds (Immediate) | < 5 minutes | Multi-Region Bucket Replication & Versioning |
| **Frontend UI (Vercel)**| 0 seconds | < 2 minutes | Instant Deployment Rollback to prior immutable hash |
| **Edge Functions / Auth**| 0 seconds | < 5 minutes | Infrastructure-as-Code redeployment |

---

## 2. Backup Schedules & Architectures

1. **Continuous WAL Archiving**: PostgreSQL Write-Ahead Logs are replicated continuously to secure secondary storage.
2. **Daily Logical Snapshots**: Daily automated schema + data dumps stored in an isolated, immutable storage bucket with 30-day retention.
3. **Evidence Media Versioning**: Cloudflare R2 object versioning protects evidence images from accidental deletion or malicious modification.
4. **Configuration Version Control**: All database migrations, edge functions, and deployment configurations are versioned in Git (`supabase/migrations/`).

---

## 3. Disaster Scenarios & Playbooks

### Scenario A: Supabase Primary Region Outage
1. **Detection**: UptimeRobot alerts health check failure on `/api/health`.
2. **Action**:
   - Access Supabase Dashboard or CLI.
   - Initiate Failover to Secondary AZ / Region from latest PITR point.
   - Update `VITE_SUPABASE_URL` in Vercel environment variables.
   - Trigger instant zero-downtime redeploy of Vercel production.
3. **Validation**: Run smoke test script to verify login, grievance creation, and data isolation.

### Scenario B: Accidental Data Corruption or Malicious Deletion
1. **Action**:
   - Isolate affected tables using feature flag / maintenance mode.
   - Restore database to timestamp `T - 5 minutes` before corruption event via Supabase PITR.
   - Replay unprocessed events from offline sync queue and `audit_logs`.
2. **Validation**: Verify record count, checksum hashes, and RLS consistency.

### Scenario C: Cloudflare R2 Storage Outage
1. **Action**:
   - Switch asset delivery endpoint to secondary backup storage.
   - Fall back to inline thumbnail preview data URLs for pending submissions.
   - Queue binary photo uploads in browser IndexedDB cache until storage connectivity restores.
