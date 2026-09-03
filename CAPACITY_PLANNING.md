# GRAM-X — Capacity Planning & Resource Quotas (Phase 10)

## 1. Safe Operating Thresholds & Scaling Triggers

| Infrastructure Layer | Metric / Resource | Current Safe Capacity | Scaling Trigger | Next Action |
|:---|:---|:---:|:---:|:---|
| **Supabase PostgreSQL** | Pooled Concurrency | 10,000 connections | Sustained > 3,500 conn | Upgrade compute tier to 4-core / 16GB RAM |
| **Database Disk Storage** | Disk Space | 100 GB SSD | Disk usage > 75% | Increase auto-scaling volume to 250 GB |
| **Cloudflare R2 Storage** | Evidence Media | 10 TB Capacity | Monthly egress > 5 TB | Enable custom image optimization caching rules |
| **Resend Transactional Email**| Daily Email Volume | 50,000 emails / day | Daily volume > 35,000 | Request quota increase to 100K tier |
| **Vercel Edge Runtime** | Serverless Invocations | 10M invocations / month | Invocations > 7M / mo | Enable Edge caching rules on public statistics |
| **AI Provider Quotas** | Triage Tokens | 2M tokens / day | Daily usage > 1.5M tokens | Switch non-urgent triage to local lightweight edge model |

---

## 2. Resource Quotas & Cost Monitoring Plan

1. **Daily Telemetry Review**: Check Supabase Dashboard usage metrics (CPU, RAM, Disk I/O, Active Connections) every morning at 08:30 IST.
2. **Alert Thresholds**: Automated email/Slack alerts dispatched when any quota reaches **80% of tier capacity**.
3. **Storage Hygiene**: Background vacuuming and periodic audit log archival to cold storage for records older than 180 days.
