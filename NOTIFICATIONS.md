# GRAM-X Notification Subsystem

## 1. Notification Types & Triggers

| Event Type | Recipient | Trigger Action |
| :--- | :--- | :--- |
| `GRIEVANCE_SUBMITTED` | Panchayat Admin | Citizen submits new complaint. |
| `GRIEVANCE_VERIFIED` | Citizen, Field Worker | Admin verifies and approves complaint. |
| `GRIEVANCE_ASSIGNED` | Assigned Worker | Work order dispatched to field technician. |
| `GRIEVANCE_STATUS_CHANGED` | Citizen | Worker starts remediation or posts progress update. |
| `GRIEVANCE_RESOLVED` | Citizen | Worker submits resolution proof. |
| `GRIEVANCE_CLOSED` | Citizen, Admin | Citizen confirms resolution or appeal deadline passes. |
| `DEADLINE_MISSED` | Admin, Collector | Statutory SLA breached; auto-escalation triggered. |

## 2. Multi-Channel Dispatch
- **In-App Live Alerts**: Real-time counter and interactive dropdown panel in the top header.
- **Transactional Email**: Server-side Resend integration dispatching templated status updates.
- **Preferences**: Users can toggle email or in-app channels independently in `NotificationPreferencesModal`.
