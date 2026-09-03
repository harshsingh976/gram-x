# GRAM-X — Operational Intelligence & Priority Scoring Engine (Phase 9)

## 1. Deterministic Priority Scoring Formula

Rather than relying on opaque black-box algorithms, GRAM-X computes a transparent, explainable **Priority Urgency Score (0 - 100)** for every active grievance:

$$\text{Priority Score} = \text{Base} + S_{\text{severity}} + S_{\text{SLA}} + S_{\text{escalation}} + S_{\text{recurrence}}$$

Where:
- $\text{Base} = 30$
- $S_{\text{severity}} = \begin{cases} +35 & \text{if priority} = \text{'critical'} \\ +20 & \text{if priority} = \text{'high'} \\ 0 & \text{otherwise} \end{cases}$
- $S_{\text{SLA}} = \begin{cases} +30 & \text{if overdue (SLA breached)} \\ +25 & \text{if hours remaining} \le 4\text{h} \\ +15 & \text{if hours remaining} \le 12\text{h} \\ 0 & \text{otherwise} \end{cases}$
- $S_{\text{escalation}} = +20 \quad \text{if escalated to higher authority}$
- $S_{\text{recurrence}} = +15 \quad \text{if repeated failure reported in same ward within 30 days}$

Bounded strictly to $[10, 100]$.

---

## 2. SLA Risk Prediction Matrix

Grievance SLA risk is categorized into 4 operational tiers:

| Risk Tier | Condition | System Response |
|:---|:---|:---|
| **CRITICAL_BREACHED** | Target resolution deadline passed | Overdue badge pulsating, instant escalation alert dispatched |
| **HIGH_RISK** | Deadline within next 4 hours | Flagged in Action Required panel, technician push reminder |
| **MEDIUM_RISK** | Deadline within next 12 hours | Prioritized in morning routine queue |
| **LOW_RISK** | Normal operational progress | Standard queue display |

---

## 3. Technician Workload Balancing Heuristic

The workload engine evaluates active task allocations across certified panchayat technicians:
- **OVERLOADED**: Active in-progress tasks $\ge 5$ OR overdue tasks $\ge 1$.
- **BALANCED**: Active in-progress tasks between $2$ and $4$.
- **UNDER_CAPACITY**: Active in-progress tasks $\le 1$.

**Rebalancing Recommendation Rule**:
When an official opens the assignment modal, the system highlights technicians with available capacity and relevant trade certifications (e.g. *Water & PHE Specialist* vs *Lineman*). Reassignment is strictly advisory and requires human confirmation.
