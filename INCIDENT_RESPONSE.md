# GRAM-X — Production Incident Response Framework (Phase 10)

## 1. Incident Classification Matrix

| Severity Level | Definition | Examples | SLA to Initial Response | SLA to Mitigation |
|:---|:---|:---|:---:|:---:|
| **SEV-1 (Critical)** | Complete service outage, authentication failure, data loss, or active security exploit | Database unreachable, RLS bypass, mass login failures | **< 15 Minutes** | **< 1 Hour** |
| **SEV-2 (Major)** | Core workflow degraded with no immediate workaround | Grievance submission failing in multiple villages, R2 uploads blocked | **< 30 Minutes** | **< 4 Hours** |
| **SEV-3 (Moderate)** | Non-critical feature failure with available workaround | AI triage provider timeout, single language key error | **< 2 Hours** | **< 24 Hours** |
| **SEV-4 (Minor)** | Minor visual or cosmetic defect | Tooltip alignment issue, chart animation glitch | **< 1 Business Day** | **Next Release** |

---

## 2. On-Call Protocol & Response Lifecycle

```
┌────────────────────────────────────────────────────────────────────────┐
│                      INCIDENT RESPONSE LIFECYCLE                       │
│                                                                        │
│   1. DETECTION     ──► UptimeRobot / Sentry automated alert pings      │
│        │                                                               │
│   2. TRIAGE        ──► Incident Commander assigns SEV level            │
│        │                                                               │
│   3. CONTAINMENT   ──► Apply circuit breaker / Vercel 1-click rollback │
│        │                                                               │
│   4. MITIGATION    ──► Deploy emergency hotfix or switch read replica  │
│        │                                                               │
│   5. VERIFICATION  ──► Run automated smoke test suite                  │
│        │                                                               │
│   6. POST-MORTEM   ──► Publish Root Cause Analysis (RCA) in <24 hours  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Communication Templates

### Stakeholder Status Notice (SEV-1 / SEV-2):
> **Subject**: [INVESTIGATING] GRAM-X Service Degradation Incident  
> **Incident ID**: INC-2026-XXXX  
> **Status**: Active Investigation  
> **Impact**: Citizens experiencing delayed grievance submission in District Raisen.  
> **Action**: SRE team is failing over to secondary database replica. Next update in 20 minutes.

### Resolution Notice:
> **Subject**: [RESOLVED] GRAM-X Service Degradation Incident  
> **Status**: Resolved & Monitoring  
> **Mitigation**: Database failover completed successfully at 14:22 IST. Zero data loss verified via WAL checkpoint. All queued offline submissions synced.
