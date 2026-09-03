# GRAM-X — Production Operations Runbook (Phase 10)

This runbook provides step-by-step instructions for standard operating procedures, failure handling, and operational troubleshooting.

---

## 1. How to Deploy to Production

1. **Verify CI Pipeline**: Ensure GitHub Actions build (`npm run lint`, `tsc -b`, `npm run build`) passed 100% on the target commit.
2. **Review Database Migrations**: Verify all SQL migrations in `supabase/migrations/` have been tested in staging and are strictly additive/backward-compatible.
3. **Execute Deployment**:
   - Push to `main` branch: Vercel automatically deploys the production build to `gramx.gov.in`.
4. **Execute Post-Deploy Smoke Test**:
   - Access `https://gramx.gov.in/`
   - Test Sign In using test credentials
   - File 1 test grievance in pilot GP
   - Verify grievance appears in `/command-center`
   - Test language toggle between Hindi and English

---

## 2. How to Roll Back a Deployment

### Instant Vercel Rollback (< 30 seconds):
1. Open **Vercel Dashboard -> Project: `gram-x` -> Deployments**.
2. Locate the previous healthy deployment hash.
3. Click **`...` -> Promote to Production**.

### Database Migration Rollback:
- If an index causes slow queries, drop concurrently:
  ```sql
  drop index concurrently if exists public.idx_problematic_index;
  ```
- If an RPC function introduced an error, replace with previous definition without dropping tables.

---

## 3. How to Check System Health

- **Public Endpoint**: `GET https://gramx.gov.in/api/health`
- **In-App Health Tab**: Navigate to `https://gramx.gov.in/command-center` -> Click **🛡️ System & Data Quality** tab.
- **Sentry Error Dashboard**: Check for new unhandled exceptions in the last 15 minutes.

---

## 4. Troubleshooting Playbooks

### A. Investigating High Database Latency
1. Log in to Supabase Dashboard -> **Database -> Query Performance**.
2. Identify slow queries ($> 100\text{ms}$).
3. Check `EXPLAIN ANALYZE` output to verify indexes are being utilized.
4. Ensure queries use pagination (`LIMIT 20 OFFSET N`).

### B. Handling Failed Notifications / Emails
1. Check Resend Dashboard for bounced or failed deliveries.
2. If Resend has an outage, notifications continue to be stored in the in-app `notifications` database table.
3. Replay failed email queue once Resend connectivity restores.

### C. Handling AI Provider Timeouts
1. Verify `ai_provider` status in Command Center.
2. If AI provider is degraded, the frontend automatically falls back to deterministic rule-based category/priority assignment.
3. Instruct Panchayat Secretaries to manually review category tags during verification.

### D. Handling Storage (R2) Upload Failures
1. Check Cloudflare Dashboard status for R2 service availability.
2. Verify presigned URL generation in Edge Function logs.
3. Offline queue in citizen browser holds evidence photos until network/storage stabilizes.
