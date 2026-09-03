# GRAM-X — Production Deployment Checklist (Phase 7)

This checklist enforces the mandatory operational, security, and scalability gates before moving GRAM-X to live government production.

---

## 1. Environment & Secrets Management
- [x] **Client-Side Secrets Audit**: Ensure only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are exposed in browser bundles.
- [x] **Zero Hardcoded Secrets**: Scanned repository for raw API keys, bearer tokens, passwords, and private certificates.
- [x] **Server-Side Credentials**: Verified `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `R2_SECRET_ACCESS_KEY`, and `CLOUDFLARE_TURNSTILE_SECRET_KEY` are stored strictly in Vercel/Supabase Edge Secret stores.
- [x] **Localhost & Dev Endpoints Removed**: Ensured `127.0.0.1:8000` and `localhost` fallbacks are guarded against in production builds (`import.meta.env.PROD`).

---

## 2. Supabase & PostgreSQL Readiness
- [x] **Row Level Security (RLS)**: Active and strictly enforced on all 20+ tables (`profiles`, `grievances`, `grievance_updates`, `grievance_sla`, `idempotency_keys`, `user_scopes`, etc.).
- [x] **Composite & Covering Indexes**: Applied `06_phase7_scale_performance_indexes.sql` for high-speed indexing on `(status, created_at)`, `(village_id, status)`, `(category, priority)`, and Full-Text Search GIN index.
- [x] **Connection Pooling**: PgBouncer / Supabase Supavisor enabled in Transaction mode (`port 6543`) for high concurrency (up to 10,000 pooled connections).
- [x] **Database Point-in-Time Recovery (PITR)**: Multi-AZ backups enabled with 7-day retention and continuous WAL replication.

---

## 3. Frontend & Vercel Configuration
- [x] **SPA Routing**: `frontend/vercel.json` configured with rewrite `/(.*) -> /index.html` ensuring direct route refreshes (`/login`, `/register`, `/transparency`) return HTTP 200 without 404s.
- [x] **Security Headers**: Configured `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- [x] **Asset Optimization**: Brotli/Gzip compression enabled, CSS and JS chunked with dynamic imports via Vite.
- [x] **Service Worker & PWA**: Registered in `main.tsx` with offline caching for core assets and offline grievance draft queue.

---

## 4. Cloudflare & Edge Security
- [x] **HTTPS Everywhere**: Strict SSL/TLS (Full/Strict mode) with automatic HTTP → HTTPS 301 redirection.
- [x] **Cloudflare Turnstile**: Bot protection enabled on sensitive forms (`/register`, `/reset-key`).
- [x] **DDoS & WAF Rules**: Cloudflare Rate Limiting rules active (max 120 req/min per IP on API routes).
- [x] **R2 Storage Boundaries**: Private bucket access with presigned upload URLs generated via Edge Functions with SHA-256 integrity validation.

---

## 5. Multilingual & Accessibility (a11y)
- [x] **Language Support**: 100% dictionary completeness across English, हिन्दी (Hindi), தமிழ் (Tamil), and తెలుగు (Telugu).
- [x] **RTL / Devanagari Typography**: Inter + Noto Sans Devanagari font stacks with comfortable line heights.
- [x] **WCAG 2.1 AA Compliance**: High contrast ratios (≥4.5:1), visible focus rings (`focus:ring-offset-white`), semantic ARIA attributes.
- [x] **Reduced Motion**: Full `@media (prefers-reduced-motion: reduce)` support disabling animations gracefully.

---

## 6. Observability & Monitoring
- [x] **Error Tracking**: Sentry integrated with automated client-side PII scrubbing (phone, email, passwords redacted before logging).
- [x] **Synthetic Uptime Monitoring**: UptimeRobot / BetterStack pinging `/api/health` every 60 seconds with P95 latency alerts (>500ms).
- [x] **Alerting Escalation**: High-severity SLA breaches and Edge Function errors routed to Discord/Slack/PagerDuty channels.

---

## 7. Sign-off Matrix

| Role | Approver | Status | Date |
|------|----------|--------|------|
| **Lead Architect** | GRAM-X Core Team | **APPROVED** | Phase 7 |
| **Security Officer** | AppSec Audit Agent | **APPROVED** | Phase 7 |
| **Panchayat Admin Rep** | Raisen Pilot Lead | **APPROVED** | Phase 7 |
| **DevOps & SRE** | SRE Lead | **APPROVED** | Phase 7 |
