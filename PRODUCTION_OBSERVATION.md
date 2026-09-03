# GRAM-X — Production Observation & Incident Response Framework (Phase 8)

## 1. Post-Deployment Monitoring Plan

Following production release, GRAM-X is continuously monitored across 5 core telemetry dimensions:

1. **Frontend Health & JavaScript Errors**: Sentry real-time exception tracking with automated PII scrubbing (Alert threshold: > 1% error rate on active sessions).
2. **API & Database Latency**: Supabase performance insights and Vercel analytics (Alert threshold: P95 API latency > 300ms for 5 consecutive minutes).
3. **SLA & Escalation Health**: Background worker SLA monitoring checking overdue items every 15 minutes.
4. **Edge Function & Worker Execution**: Supabase Edge runtime logs tracking invocation success rates (Target: ≥ 99.9%).
5. **Storage & Media Bandwidth**: Cloudflare R2 bandwidth and upload success rates.

---

## 2. Incident Classification & Severity Matrix

```
┌─────────────────────────────────────────────────────────────┐
│                 INCIDENT RESPONSE LIFECYCLE                 │
│                                                             │
│   1. DETECT      ──► Automated Sentry / UptimeRobot Alert   │
│        │                                                    │
│   2. INVESTIGATE ──► Triage severity (SEV-1 to SEV-4)       │
│        │                                                    │
│   3. CONTAIN     ──► Circuit Breaker / Vercel Rollback      │
│        │                                                    │
│   4. RESOLVE     ──► Deploy Hotfix & Replay Sync Queue      │
│        │                                                    │
│   5. POST-MORTEM ──► RCA documented within 24 hours         │
└─────────────────────────────────────────────────────────────┘
```

| Severity | Incident Type | Description | Response Time | Action |
|:---|:---|:---|:---:|:---|
| **SEV-1 (Critical)** | Outage / Security | Complete application downtime, auth failure, or RLS bypass | **Immediate (<15m)** | Rollback via `ROLLBACK.md`, alert incident commander |
| **SEV-2 (Major)** | Performance / Feature | AI triage offline, R2 photo upload failing, or SLA worker stuck | **< 1 Hour** | Trigger circuit breaker in `featureFlags.ts`, fallback to manual |
| **SEV-3 (Moderate)**| Localized Glitch | Translation key missing in single language or chart tooltip error | **< 4 Hours** | Patch in next minor hotfix release |
| **SEV-4 (Minor)** | Cosmetic | Minor CSS misalignment on edge screen width | **Next Release** | Standard development sprint cycle |

---

## 3. Incident Review & Continuous Feedback Loop

All incidents generate a post-mortem review incorporating:
- **Timeline of Events**: Exact timestamps from initial alert to mitigation.
- **Root Cause Analysis (RCA)**: Underlying code, configuration, or infrastructure failure.
- **Preventative Measures**: New automated tests added to `scratch/` test suites to prevent regression.
