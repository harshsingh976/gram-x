-- ================================================================
-- GRAM-X PHASE 3: AI INSIGHTS, OCR RESULTS, MAPS & SMART SEARCH
-- Schema, Indexes, & Row Level Security (RLS) Policies
-- ================================================================

-- 1. Grievance AI Insights Table (Advisory, Non-Overriding)
create table if not exists public.grievance_ai_insights (
    id uuid primary key default gen_random_uuid(),
    grievance_id bigint references public.grievances(id) on delete cascade not null,
    suggested_category text not null check (suggested_category in ('water', 'electricity', 'roads', 'sanitation', 'infrastructure', 'other')),
    suggested_priority text not null check (suggested_priority in ('low', 'medium', 'high', 'critical')),
    suggested_department text not null default 'Panchayat Engineering',
    confidence_score double precision not null default 0.85,
    summary text,
    tags text[] default '{}',
    model_name text not null default 'rule-based-v1',
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_ai_insights_grievance_id on public.grievance_ai_insights(grievance_id);

-- 2. Grievance OCR Results Table (Evidence Attachment Text Extraction)
create table if not exists public.grievance_ocr_results (
    id uuid primary key default gen_random_uuid(),
    attachment_id uuid references public.grievance_attachments(id) on delete cascade,
    grievance_id bigint references public.grievances(id) on delete cascade not null,
    extracted_text text not null,
    language text not null default 'en',
    confidence double precision not null default 0.90,
    status text not null check (status in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')) default 'COMPLETED',
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_ocr_results_grievance_id on public.grievance_ocr_results(grievance_id);

-- 3. Full-Text Search and Spatial Location Indexes on Grievances
create index if not exists idx_grievances_location on public.grievances(location_lat, location_lng);

-- Enable pg_trgm for fuzzy text matching if supported
create extension if not exists pg_trgm with schema public;

create index if not exists idx_grievances_search on public.grievances using gin(
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(reference_no, ''))
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

alter table public.grievance_ai_insights enable row level security;
alter table public.grievance_ocr_results enable row level security;

-- ─── AI INSIGHTS RLS ─────────────────────────────────────────
create policy "Users can view AI insights for accessible grievances"
    on public.grievance_ai_insights for select
    using (
        exists (
            select 1 from public.grievances g
            where g.id = grievance_id and (
                g.citizen_id = auth.uid()
                or g.assigned_worker_id = auth.uid()
                or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'district'))
            )
        )
    );

create policy "System and Admins can insert AI insights"
    on public.grievance_ai_insights for insert
    with check (
        auth.uid() is not null and
        exists (
            select 1 from public.grievances g
            where g.id = grievance_id and (
                g.citizen_id = auth.uid()
                or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'district'))
            )
        )
    );

-- ─── OCR RESULTS RLS ─────────────────────────────────────────
create policy "Users can view OCR results for accessible grievances"
    on public.grievance_ocr_results for select
    using (
        exists (
            select 1 from public.grievances g
            where g.id = grievance_id and (
                g.citizen_id = auth.uid()
                or g.assigned_worker_id = auth.uid()
                or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'district'))
            )
        )
    );

create policy "Users can insert OCR results on accessible grievances"
    on public.grievance_ocr_results for insert
    with check (
        auth.uid() is not null and
        exists (
            select 1 from public.grievances g
            where g.id = grievance_id and (
                g.citizen_id = auth.uid()
                or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'district'))
            )
        )
    );
