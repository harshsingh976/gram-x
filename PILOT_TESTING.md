# GRAM-X — Real-User Pilot Testing & Staging Environment Guide (Phase 8)

## 1. Controlled Pilot Environment Architecture

To ensure realistic user testing without risking production citizen data, GRAM-X maintains strict separation between **Development**, **Staging/Pilot**, and **Production** environments:

```
┌─────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT SEPARATION                   │
│                                                             │
│   DEVELOPMENT (Local / PR Previews)                         │
│   • Local storage / Mock fallbacks                          │
│   • Hot-reload UI development                               │
│                                                             │
│   STAGING / PILOT (pilot.gramx.gov.in / Preview Vercel)     │
│   • Controlled multi-tier synthetic dataset                 │
│   • Real Supabase Auth & PostgreSQL instance                │
│   • Pilot feedback widget active                            │
│   • Zero real citizen PII                                   │
│                                                             │
│   PRODUCTION (gramx.gov.in)                                 │
│   • Real Citizen & Panchayat operations                     │
│   • Multi-AZ WAL PITR replication                           │
│   • Cloudflare Turnstile & strict WAF                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Staging Pilot Dataset Topology

The pilot staging environment is pre-populated with realistic administrative hierarchy and grievance test scenarios:

- **States**: 1 (Madhya Pradesh)
- **Districts**: 2 (Raisen, Vidisha)
- **Blocks**: 4 (Sanchi, Gairatganj, Begamganj, Silwani)
- **Panchayats**: 20 Gram Panchayats
- **Villages**: 50 Villages
- **Synthetic Grievance Scenarios**:
  - 100 Fresh Submitted Grievances (Water, Roads, Electricity, Sanitation)
  - 40 Assigned & In-Progress Repairs
  - 30 Resolved Grievances awaiting citizen confirmation
  - 15 Overdue SLA Breaches triggering automated escalation
  - 10 Closed Grievances with citizen 1-5 star feedback ratings
  - 5 Reopen Appeals for administrative review

---

## 3. Pilot Feedback Triage & Bug Resolution SLA

User feedback collected via `pilotFeedbackService.ts` is triaged based on severity:

| Severity Level | Definition | Target Resolution SLA |
|:---|:---|:---:|
| **P0 (Critical)** | Security vulnerability, data loss, total workflow blocker | **< 4 Hours** |
| **P1 (High)** | Core workflow broken for a specific role or browser | **< 24 Hours** |
| **P2 (Medium)** | Usability confusion, layout overflow on specific device | **< 48 Hours** |
| **P3 (Low)** | Translation phrasing refinement, minor visual polish | **Next Sprint Cycle** |
| **P4 (Enhancement)**| New feature suggestions from pilot participants | **Roadmap Backlog** |
