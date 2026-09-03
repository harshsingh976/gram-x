# GRAM-X — Central Alert Engine & Deduplication Hierarchy (Phase 9)

## 1. Alert Severity Matrix & Action Channels

| Alert Level | Trigger Condition | Delivery Channel | Required Action Time |
|:---|:---|:---:|:---:|
| **CRITICAL (P0)** | Overdue SLA breach on drinking water/health asset; unassigned critical defect > 2h | In-App Banner + SMS / Resend to Panchayat Secretary & BDO | **< 2 Hours** |
| **HIGH (P1)** | Grievance SLA expires in < 4h; technician overload detected (≥5 tasks) | In-App Action Required Panel + Email Summary | **< 4 Hours** |
| **MEDIUM (P2)** | Citizen reopen request / appeal filed; volume spike anomaly detected | Command Center Queue + Notification Center | **< 24 Hours** |
| **LOW (P3)** | General status change, milestone resolved, routine feedback submitted | In-App Bell Notification Center | **Informational** |

---

## 2. Spatial & Temporal Alert Deduplication

To prevent administrative alert fatigue:
1. **Cluster Aggregation**: When multiple complaints describe the same broken transformer or ruptured main line, they are aggregated into a single alert:
   > *"27 Water Supply Grievances reported in Kalyanpura Ward 3 (North Reservoir Valve Fault)"*
2. **Rate-Limited Reminders**: Technician overdue alerts are capped at max 1 reminder per 4-hour window per active ticket.
