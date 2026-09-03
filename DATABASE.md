# GRAM-X Database Documentation

## 1. Relational Schema & Migrations

All migrations reside in `supabase/migrations/`:
- `01_phase1_auth_profiles_rls.sql`: Profiles, roles, and basic RLS.
- `02_phase2_grievance_system_rls.sql`: Grievances, timeline updates, assignments, escalations, attachments.
- `03_phase3_ai_ocr_maps_rls.sql`: AI insights, OCR results, spatial indexing, full-text search.
- `04_phase4_notifications_sla_security.sql`: Notifications, preferences, SLA tracking, SLA triggers.
- `05_phase5_ecosystem_scale_governance.sql`: Hierarchy (`states`, `districts`, `blocks`, `panchayats`, `villages`, `user_scopes`), citizen feedback, appeals, directory, public notices, audit logs, feature flags.
- `06_phase7_scale_performance_indexes.sql`: Composite indexes, Full-Text GIN index, `idempotency_keys`, `rate_limit_buckets`, and paginated RPC functions (`get_paginated_grievances`, `get_governance_kpi_summary`) for 100K-scale execution.

---

## 2. Table Catalog

| Table | Description | Key Indexes |
| :--- | :--- | :--- |
| `profiles` | Extended Supabase Auth user profiles with role and phone. | `role`, `village_id` |
| `grievances` | Core complaint records with auto-generated `GX-YYYY-NNNNNN` reference. | `citizen_id`, `(status, created_at DESC)`, `(village_id, status)`, `(category, priority)`, `fts_gin` |
| `grievance_updates` | Auditable history of status changes and worker comments. | `grievance_id`, `created_at` |
| `grievance_sla` | Statutory verification and resolution deadlines. | `(is_breached, target_resolution_at)` |
| `notifications` | Central in-app alerts and milestone event tracking. | `(user_id, is_read, created_at DESC)` |
| `grievance_feedback` | Citizen 1-5 star ratings and qualitative resolution satisfaction. | `grievance_id`, `citizen_id` |
| `grievance_reopen_requests` | Citizen appeals on prematurely closed grievances. | `grievance_id`, `status` |
| `government_services` | Public service directory with helplines and SLA days. | `category`, `is_active` |
| `public_notices` | Civic notices and emergency disaster announcements. | `status`, `created_at` |
| `idempotency_keys` | De-duplication keys for offline submission syncs and network retries. | `(key, user_id)`, `expires_at` |
| `rate_limit_buckets` | Token-bucket rate limiting state for Edge Functions and API protection. | `last_refilled_at` |
| `audit_logs` | Immutable audit trail for administrative operations. | `(entity_type, entity_id, created_at DESC)` |


---

## 3. Row Level Security (RLS) Matrix

- **Citizens**: Select/insert own grievances; insert feedback on resolved complaints; request reopen on closed complaints; view public hierarchy and notices.
- **Field Workers**: View assigned grievances; update remediation notes and mark resolved.
- **Panchayat Admins**: Full CRUD over village grievances, worker assignments, SLA monitoring, and reopen reviews.
- **District Collectors**: District-wide oversight, cross-panchayat escalations, and global analytics.
- **Public**: Anonymized access to `/transparency` aggregated views, services directory, and active public notices without citizen PII.
