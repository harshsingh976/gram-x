# GRAM-X Security Model & Hardening

## 1. Zero-Trust Frontend Rule
- **No Private Secrets in Browser Bundles**: All transactional email (Resend API key), cloud storage credentials (Cloudflare R2), and AI engine keys are held strictly in Supabase Edge Functions or environment variables.
- **Frontend Environment Variables**: Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are packaged in the client.

## 2. Row Level Security (RLS) Enforcement
- All tables have `ROW LEVEL SECURITY` enabled.
- Authorization is checked at the PostgreSQL engine level via `auth.uid()` and verified against `public.profiles` or `public.user_scopes`.
- No user can access or modify another citizen's grievance records through direct API manipulation.

## 3. Abuse Protection & Rate Limiting
- **Client-Side Sliding Window Limiter**: Guards sensitive operations (Login: 5/min, Registration: 3/5min, Grievance submission: 10/hour, AI triage: 20/min).
- **Cloudflare Turnstile Support**: Bot verification boundary before high-volume public endpoints.

## 4. PII Protection & Data Sanitization
- Public transparency queries return aggregated metrics and never expose citizen phone numbers, names, or residential coordinates.
- Observability and telemetry loggers scrub phone numbers (`[PHONE]`), emails (`[EMAIL]`), and auth tokens (`[REDACTED]`) before dispatch.
