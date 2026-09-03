# GRAM-X — Governance Command Center Specification (Phase 9)

## 1. Mission & Scope

The **Governance Command Center** (`/command-center`) transforms GRAM-X from a grievance ticketing tool into a **centralized operational intelligence platform** for Panchayat Secretaries, Block Officials, District Collectors, and State Administrators.

It answers the 5 essential administrative questions within 3 seconds of opening:
1. **What is happening right now?** (Active workload, in-progress tasks)
2. **What requires human decision immediately?** (Action Required panel: SLA risks, unassigned critical items, appeals)
3. **What is getting worse?** (Surging categories, overdue trends)
4. **Who is overloaded?** (Technician capacity & workload balancing suggestions)
5. **Where are the hotspots?** (Geographic cluster concentrations)

---

## 2. Access Control & Multi-Tenant Scope Hierarchy

Access to `/command-center` is strictly enforced via `ProtectedRoute` and PostgreSQL Row Level Security:

| Role | Scope Level | Visibility & Capabilities |
|:---|:---:|:---|
| **Panchayat Admin** | Village / GP | Triage grievances within assigned Gram Panchayat; dispatch certified field workers; review appeals. |
| **Block Official (BDO)** | Block | Multi-panchayat comparative leaderboard; regional backlog monitoring; cross-panchayat escalations. |
| **District Collector (DM)** | District | District-wide macro visibility; 3D Digital Twin simulation; administrative directive issuance. |
| **State Admin / Super Admin**| State / Global| Statewide equity metrics; inter-district benchmarking; public transparency oversight. |
| **Citizen / Public** | *Blocked* | Redirection to `/` or `/transparency` (anonymized public statistics only). |

---

## 3. Core Command Center Panels

```
┌────────────────────────────────────────────────────────────────────────┐
│                      GOVERNANCE COMMAND CENTER                         │
│                                                                        │
│  [ACTION REQUIRED NOW]                                                 │
│  • 7 Grievances Approaching SLA Deadline Today (<4h)                   │
│  • 3 Critical Grievances Pending Technician Assignment                 │
│  • 2 Citizen Appeals Awaiting Administrative Review                    │
│                                                                        │
│  [OPERATIONAL KPI OVERVIEW]                                            │
│  Total: 142 | In Progress: 12 | Resolved: 108 | Overdue: 9 | Risk: 7   │
│                                                                        │
│  [INTELLIGENCE TABS]                                                   │
│  1. 🔥 Priority Operational Queue (Deterministic 0-100 Urgency Score)   │
│  2. 👥 Technician Workload Intelligence & Balancing Suggestions        │
│  3. 📈 Service Health Indices & 30-Day Volume Trends                   │
│  4. ⚠️ Statistical Anomalies & Recurring Problem Clusters              │
│  5. ✨ Executive AI-Assisted Narrative (with Citing Source Metrics)    │
│  6. 🛡️ System Infrastructure & Data Quality Audit                       │
└────────────────────────────────────────────────────────────────────────┘
```
