# GRAM-X Platform Architecture

## 1. System Overview

GRAM-X is a digital rural-governance platform connecting citizens, field workers, Panchayat administrations, and District Collectors. The platform uses a serverless architecture designed for high availability, low maintenance, and rural network resilience.

```
                         CITIZEN / WORKER / ADMIN
                                   │
                                   ▼
                            [Cloudflare CDN]
                         (DNS / Turnstile / DDoS)
                                   │
                                   ▼
                         [Vercel React PWA]
                      (Service Worker / Offline)
                                   │
                        [Supabase JS Client]
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
    [Supabase Auth]       [PostgreSQL + RLS]       [Cloudflare R2]
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
    [Grievances & SLA]       [Notifications]        [Audit History]
          │                        │                        │
          ▼                        ▼                        ▼
   [Auto-Escalation]        [Resend Email]          [Sentry Observability]
```

---

## 2. Core Subsystems

### 2.1 Multi-Level Administrative Hierarchy
- **State $\rightarrow$ District $\rightarrow$ Block $\rightarrow$ Panchayat $\rightarrow$ Village**: Administrative scopes map directly to database records in `user_scopes`.
- **Role Capabilities**:
  - `CITIZEN`: Log complaints, track milestones, rate satisfaction, appeal closures.
  - `WORKER`: Accept remediation work orders, upload completion evidence, mark resolved.
  - `PANCHAYAT_ADMIN`: Verify complaints, assign field technicians, monitor village SLAs.
  - `BLOCK_OFFICIAL`: Cross-panchayat coordination and resource allocation.
  - `DISTRICT_COLLECTOR`: District-wide oversight, bottleneck remediation, and escalated grievance interventions.
  - `STATE_ADMIN` / `SUPER_ADMIN`: Statewide analytics, policy configuration, and audit reviews.

### 2.2 Public Transparency (`/transparency`) & Service Directory (`/services`)
- Anonymized aggregate governance statistics without citizen PII.
- Open public directory of government departments, helplines, and active civic notices.

### 2.3 Grievance Lifecycle & Idempotent SLA Engine
- State transitions: `SUBMITTED` $\rightarrow$ `VERIFIED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` $\rightarrow$ `CLOSED`.
- Priority-based statutory SLAs: Critical (12h/24h), High (24h/48h), Medium (48h/96h), Low (72h/168h).
- Idempotent automated escalation engine to avoid duplicate escalations and notification spam.

### 2.4 Voice & Offline Resilience
- Browser-native speech recognition for Hindi/English input.
- Stale-while-revalidate Service Worker caching.
- Local draft preservation preventing data loss during signal dropouts.
