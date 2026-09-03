# GRAM-X Deployment Guide

## 1. Hosting Architecture
- **Frontend**: Vercel (Single Page React PWA with client routing).
- **Backend & Database**: Supabase (PostgreSQL with Edge Functions).
- **DNS & CDN**: Cloudflare (SSL/TLS, DDoS protection, edge caching).

## 2. Environment Variables Configuration

### Frontend (Vercel)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Serverless Backend (Supabase Secrets)
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_123456789...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=gramx-attachments
AI_API_KEY=...
```

## 3. Database Initialization Steps
1. Navigate to Supabase SQL Editor.
2. Run migrations sequentially from `supabase/migrations/`:
   - `01_phase1_auth_profiles_rls.sql`
   - `02_phase2_grievance_system_rls.sql`
   - `03_phase3_ai_ocr_maps_rls.sql`
   - `04_phase4_notifications_sla_security.sql`
   - `05_phase5_ecosystem_scale_governance.sql`
   - `06_phase7_scale_performance_indexes.sql`

## 4. Operational Runbooks
- [Production Deployment Checklist](./PRODUCTION_CHECKLIST.md)
- [100K-User Load Testing Report](./LOAD_TESTING.md)
- [Disaster Recovery & Business Continuity Plan](./DISASTER_RECOVERY.md)
- [Production Rollback Strategy](./ROLLBACK.md)

